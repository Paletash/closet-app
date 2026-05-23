import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useLookStore = create((set, get) => ({
  looks: [],
  loading: false,
  error: null,

  /**
   * Fetch looks for a given month
   */
  fetchLooks: async (userId, year, month) => {
    set({ loading: true, error: null })

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('looks_del_dia')
      .select('*')
      .eq('user_id', userId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ looks: data || [], loading: false })
  },

  /**
   * Fetch recent looks (for dashboard / gallery)
   */
  fetchRecentLooks: async (userId, limit = 10) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('looks_del_dia')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(limit)

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ looks: data || [], loading: false })
  },

  /**
   * Add a look of the day
   */
  addLook: async (userId, file, fecha, notas) => {
    set({ loading: true, error: null })

    // 1. Upload photo to storage
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/looks/${fecha}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('prendas-fotos')
      .upload(filePath, file)

    if (uploadError) {
      set({ error: uploadError.message, loading: false })
      return { error: uploadError }
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('prendas-fotos')
      .getPublicUrl(filePath)

    // 3. Insert record
    const { data, error } = await supabase
      .from('looks_del_dia')
      .insert({
        user_id: userId,
        foto_url: urlData.publicUrl,
        fecha,
        notas: notas || null,
      })
      .select()
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return { error }
    }

    set((state) => ({
      looks: [data, ...state.looks],
      loading: false,
    }))
    return { data }
  },

  /**
   * Delete a look
   */
  deleteLook: async (lookId) => {
    const { error } = await supabase
      .from('looks_del_dia')
      .delete()
      .eq('id', lookId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set((state) => ({
      looks: state.looks.filter((l) => l.id !== lookId),
    }))
    return { success: true }
  },
}))
