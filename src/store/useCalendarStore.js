import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCalendarStore = create((set, get) => ({
  entries: [], // { id, outfit_id, fecha, outfit: { ...outfitData, prendas: [...] } }
  loading: false,
  error: null,

  /**
   * Fetch all usage entries for a given month (year-month)
   * Includes the outfit and its prendas via joins
   */
  fetchEntries: async (userId, year, month) => {
    set({ loading: true, error: null })

    // Build date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('historial_usos')
      .select(`
        id,
        outfit_id,
        fecha,
        outfits (
          id,
          ocasion,
          generado_por_ia,
          es_favorito,
          outfit_prendas (
            prenda_id,
            prendas (*)
          )
        )
      `)
      .eq('user_id', userId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    // Flatten prendas from the nested joins
    const entries = (data || []).map((entry) => ({
      ...entry,
      outfit: entry.outfits
        ? {
            ...entry.outfits,
            prendas:
              entry.outfits.outfit_prendas
                ?.map((op) => op.prendas)
                .filter(Boolean) || [],
          }
        : null,
    }))

    set({ entries, loading: false })
  },

  /**
   * Log an outfit as "used" on a specific date
   */
  logUsage: async (userId, outfitId, fecha) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('historial_usos')
      .insert({
        user_id: userId,
        outfit_id: outfitId,
        fecha,
      })
      .select()
      .single()

    if (error) {
      // Duplicate constraint — user already logged this outfit on this date
      if (error.code === '23505') {
        set({ error: 'Ya registraste este outfit en esta fecha.', loading: false })
        return { error: { message: 'Ya registraste este outfit en esta fecha.' } }
      }
      set({ error: error.message, loading: false })
      return { error }
    }

    // Refetch the current month to stay in sync
    const d = new Date(fecha)
    await get().fetchEntries(userId, d.getFullYear(), d.getMonth() + 1)

    set({ loading: false })
    return { data }
  },

  /**
   * Remove a usage entry
   */
  removeUsage: async (entryId, userId, year, month) => {
    const { error } = await supabase
      .from('historial_usos')
      .delete()
      .eq('id', entryId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    // Refetch to stay in sync
    await get().fetchEntries(userId, year, month)
    return { success: true }
  },
}))
