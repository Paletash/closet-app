import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
  },

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters, iaMatches: null } // clear IA matches if manual filters are touched
  })),

  setFiltersFromVisualSearch: (data) => set((state) => ({
    filters: {
      categoria: null, color: null, estilo: null, temporada: null, tag: null, search: '',
      iaMatches: data.prendas_detectadas || []
    }
  })),

  clearFilters: () => set({
    filters: { categoria: null, color: null, estilo: null, temporada: null, tag: null, search: '', iaMatches: null }
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

      if (filters.categoria && item.categoria !== filters.categoria) return false
      if (filters.color && item.color_principal !== filters.color) return false
      if (filters.estilo && !(item.estilos || []).includes(filters.estilo)) return false
      if (filters.temporada && !(item.temporadas || []).includes(filters.temporada)) return false
      if (filters.tag && !(item.etiquetas || []).includes(filters.tag)) return false
      if (filters.iaMatches && filters.iaMatches.length > 0) {
        // AI match logic: Item must match at least one detected prenda's category, or color, or style.
        // We'll require it to match the category of at least one detected garment to be relevant.
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

  addClothing: async (clothing, imageFile) => {
    set({ loading: true, error: null })

    try {
      const userId = clothing.user_id
      let fileExt = imageFile.name.split('.').pop().toLowerCase()
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        fileExt = 'jpg' // Fallback seguro
      }
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      console.log('[addClothing] Step 1: Uploading image...', fileName)

      // Upload image with timeout to prevent infinite hang
      const uploadPromise = supabase.storage
        .from('prendas-fotos')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type || 'image/jpeg',
        })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('La subida de imagen tardó demasiado (30s). Revisa tu conexión a internet o los permisos del bucket "prendas-fotos" en Supabase Storage.')), 30000)
      )

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise])

      if (uploadError) {
        console.error('[addClothing] Upload error:', uploadError)
        throw uploadError
      }

      console.log('[addClothing] Step 2: Getting public URL...')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('prendas-fotos')
        .getPublicUrl(fileName)

      console.log('[addClothing] Step 3: Inserting into DB...', urlData?.publicUrl)

      // Insert clothing record
      const { data, error } = await supabase
        .from('prendas')
        .insert({
          ...clothing,
          foto_url: urlData.publicUrl,
        })
        .select()
        .single()

      console.log('[addClothing] Step 4: Insert result:', { data, error })

      if (error) throw error

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
      const { error } = await supabase
        .from('prendas')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        clothes: state.clothes.filter((c) => c.id !== id),
        loading: false,
      }))
      return { success: true }
    } catch (error) {
      console.error('[deleteClothing] Error deleting clothing:', error)
      set({ error: error.message, loading: false })
      return { error }
    }
  },
}))
