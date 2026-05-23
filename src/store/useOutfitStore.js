import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useOutfitStore = create((set, get) => ({
  outfits: [],
  loading: false,
  error: null,

  fetchOutfits: async (userId) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('outfits')
      .select(`
        *,
        outfit_prendas (
          prenda_id,
          prendas (*)
        )
      `)
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    // Flatten the prendas from the join
    const outfitsWithPrendas = (data || []).map((outfit) => ({
      ...outfit,
      prendas: outfit.outfit_prendas?.map((op) => op.prendas).filter(Boolean) || [],
    }))

    set({ outfits: outfitsWithPrendas, loading: false })
  },

  saveOutfit: async (userId, prendaIds, ocasion, generadoPorIA = false) => {
    set({ loading: true, error: null })

    try {
      // Create outfit
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: userId,
          ocasion,
          generado_por_ia: generadoPorIA,
          es_favorito: false,
        })
        .select()
        .single()

      if (outfitError) throw outfitError

      // Create outfit_prendas relations
      const relations = prendaIds.map((prenda_id) => ({
        outfit_id: outfit.id,
        prenda_id,
      }))

      const { error: relError } = await supabase
        .from('outfit_prendas')
        .insert(relations)

      if (relError) throw relError

      // Refetch to get full data
      await get().fetchOutfits(userId)

      set({ loading: false })
      return { data: outfit }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { error }
    }
  },

  deleteOutfit: async (id, userId) => {
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set((state) => ({
      outfits: state.outfits.filter((o) => o.id !== id),
    }))
    return { success: true }
  },

  toggleFavorite: async (id) => {
    const outfit = get().outfits.find((o) => o.id === id)
    if (!outfit) return

    const { data, error } = await supabase
      .from('outfits')
      .update({ es_favorito: !outfit.es_favorito })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      return
    }

    set((state) => ({
      outfits: state.outfits.map((o) =>
        o.id === id ? { ...o, es_favorito: data.es_favorito } : o
      ),
    }))
  },
}))
