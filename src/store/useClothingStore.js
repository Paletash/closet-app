import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { mediaReference } from '../lib/mediaReference'
import { deletePhoto } from '../lib/privateMedia'

export const useClothingStore = create((set, get) => ({
  clothes: [],
  loading: false,
  error: null,
  hasFetched: false,
  filters: {
    categoria: null,
    color: null,
    estilo: null,
    temporada: null,
    tag: null,
    search: '',
    iaMatches: null,
    limpieza: null, // null = todas, 'limpia' = solo limpias, 'sucia' = solo sucias
  },

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters, iaMatches: null } // clear IA matches if manual filters are touched
  })),

  setFiltersFromVisualSearch: (data) => set({
    filters: {
      categoria: null, color: null, estilo: null, temporada: null, tag: null, search: '',
      iaMatches: Array.isArray(data.prendas_detectadas) ? data.prendas_detectadas.filter(item => item && typeof item.categoria === 'string') : [], limpieza: null
    }
  }),

  clearFilters: () => set({
    filters: { categoria: null, color: null, estilo: null, temporada: null, tag: null, search: '', iaMatches: null, limpieza: null }
  }),

  fetchClothes: async (userId, force = false) => {
    const currentClothes = get().clothes
    const isDifferentUser = currentClothes.length > 0 && currentClothes[0].user_id !== userId

    if (get().hasFetched && !force && !isDifferentUser && currentClothes.length > 0) {
      return
    }

    set({ loading: true, error: null })
    let query = supabase
      .from('prendas')
      .select('*')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })

    const { data, error } = await query

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ clothes: data || [], loading: false, hasFetched: true })
  },

  getFilteredClothes: () => {
    const { clothes, filters } = get()
    return clothes.filter((item) => {
      // Filter out non-active by default in normal views
      const status = item.estado || 'activa'
      if (status !== 'activa') return false

      // Limpieza filter
      if (filters.limpieza === 'limpia' && item.sucia === true) return false
      if (filters.limpieza === 'sucia' && item.sucia !== true) return false

      if (filters.categoria && item.categoria !== filters.categoria) return false
      if (filters.color && item.color_principal !== filters.color) return false
      if (filters.estilo && !(item.estilos || []).includes(filters.estilo)) return false
      if (filters.temporada && !(item.temporadas || []).includes(filters.temporada)) return false
      if (filters.tag && !(item.etiquetas || []).includes(filters.tag)) return false
      if (filters.iaMatches && filters.iaMatches.length > 0) {
        const matchAny = filters.iaMatches.some(detectada => {
          if (!detectada.categoria) return false
          const matchCat = item.categoria === detectada.categoria
          const matchColor = detectada.color ? item.color_principal === detectada.color : true
          return matchCat && matchColor
        })
        if (!matchAny) return false
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const matchName = (item.subcategoria || '').toLowerCase().includes(search)
        const matchBrand = (item.marca || '').toLowerCase().includes(search)
        const matchNotes = (item.notas || '').toLowerCase().includes(search)
        if (!matchName && !matchBrand && !matchNotes) return false
      }
      return true
    })
  },

  /**
   * Returns only clean, active clothes (for outfit generation)
   */
  getCleanClothes: () => {
    const { clothes } = get()
    return clothes.filter(item => {
      const status = item.estado || 'activa'
      return status === 'activa' && item.sucia !== true
    })
  },

  /**
   * Toggle dirty/clean status for a clothing item
   */
  toggleDirty: async (id, sucia) => {
    // Optimistic update
    set((state) => ({
      clothes: state.clothes.map((c) => (c.id === id ? { ...c, sucia } : c)),
    }))

    const { error } = await supabase
      .from('prendas')
      .update({ sucia })
      .eq('id', id)

    if (error) {
      // Rollback on failure
      set((state) => ({
        clothes: state.clothes.map((c) => (c.id === id ? { ...c, sucia: !sucia } : c)),
      }))
      console.error('[toggleDirty] Error:', error)
    }
  },

  addClothing: async (clothing, imageFile) => {
    set({ loading: true, error: null })

    try {
      const userId = clothing.user_id
      let fileExt = imageFile.name.split('.').pop().toLowerCase()
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        fileExt = 'jpg' // Fallback seguro
      }
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('prendas-fotos')
        .upload(fileName, imageFile, {
          cacheControl: '0',
          upsert: false,
          contentType: imageFile.type || 'image/jpeg',
        })

      if (uploadError) {
        console.error('[addClothing] Upload error:', uploadError)
        throw uploadError
      }

      // Insert clothing record
      const { data, error } = await supabase
        .from('prendas')
        .insert({
          ...clothing,
          foto_url: mediaReference('prendas-fotos', fileName),
        })
        .select()
        .single()

      if (error) {
        await supabase.storage.from('prendas-fotos').remove([fileName])
        throw error
      }

      set((state) => ({
        clothes: [data, ...state.clothes],
        loading: false,
      }))

      return { data }
    } catch (error) {
      console.error('[addClothing] Caught error:', error)
      set({ error: error.message, loading: false })
      return { error }
    }
  },

  updateClothing: async (id, updates) => {
    const { data, error } = await supabase
      .from('prendas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set((state) => ({
      clothes: state.clothes.map((c) => (c.id === id ? data : c)),
    }))
    return { data }
  },

  deleteClothing: async (id) => {
    set({ loading: true, error: null })
    try {
      const photo = get().clothes.find(item => item.id === id)?.foto_url
      const { error } = await supabase
        .from('prendas')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        clothes: state.clothes.filter((c) => c.id !== id),
        loading: false,
      }))
      try { await deletePhoto(photo) } catch { return { success: true, warning: 'La prenda se eliminó, pero no se pudo borrar su foto del almacenamiento. Se requiere revisar la limpieza de archivos.' } }
      return { success: true }
    } catch (error) {
      console.error('[deleteClothing] Error deleting clothing:', error)
      set({ error: error.message, loading: false })
      return { error }
    }
  },
}))
