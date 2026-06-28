import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  hasFetched: false,

  /**
   * Fetch all wishlist items for a user
   */
  fetchItems: async (userId, force = false) => {
    const currentItems = get().items
    const isDifferentUser = currentItems.length > 0 && currentItems[0].user_id !== userId

    if (get().hasFetched && !force && !isDifferentUser && currentItems.length > 0) {
      return
    }

    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ items: data || [], loading: false, hasFetched: true })
  },

  /**
   * Add a new item to the wishlist
   */
  addItem: async (userId, item) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        nombre: item.nombre,
        categoria: item.categoria,
        url: item.url || null,
        imagen_url: item.imagen_url || null,
        precio: item.precio ? parseFloat(item.precio) : null,
        notas: item.notas || null,
        prioridad: item.prioridad || 'media',
      })
      .select()
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return { error }
    }

    set((state) => ({
      items: [data, ...state.items],
      loading: false,
    }))
    return { data }
  },

  /**
   * Toggle purchased status
   */
  togglePurchased: async (itemId) => {
    const item = get().items.find((i) => i.id === itemId)
    if (!item) return

    const { error } = await supabase
      .from('wishlist')
      .update({ comprado: !item.comprado })
      .eq('id', itemId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    // Optimistic update
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, comprado: !i.comprado } : i
      ),
    }))
    return { success: true }
  },

  /**
   * Delete a wishlist item
   */
  deleteItem: async (itemId) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }))
    return { success: true }
  },
}))
