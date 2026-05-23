import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTripStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  packedItems: [], // prenda IDs for current trip
  loading: false,
  error: null,

  /**
   * Fetch all trips for a user
   */
  fetchTrips: async (userId) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('viajes')
      .select(`
        *,
        viaje_prendas (
          prenda_id
        )
      `)
      .eq('user_id', userId)
      .order('fecha_inicio', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    const trips = (data || []).map((trip) => ({
      ...trip,
      prendaCount: trip.viaje_prendas?.length || 0,
    }))

    set({ trips, loading: false })
  },

  /**
   * Fetch a single trip with full prenda details
   */
  fetchTrip: async (tripId) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('viajes')
      .select(`
        *,
        viaje_prendas (
          prenda_id,
          empacado,
          prendas (*)
        )
      `)
      .eq('id', tripId)
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    const trip = {
      ...data,
      prendas: data.viaje_prendas
        ?.map((vp) => ({
          ...vp.prendas,
          empacado: vp.empacado ?? false,
        }))
        .filter(Boolean) || [],
    }

    set({ currentTrip: trip, loading: false })
  },

  /**
   * Create a new trip
   */
  createTrip: async (userId, tripData) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('viajes')
      .insert({
        user_id: userId,
        destino: tripData.destino,
        fecha_inicio: tripData.fecha_inicio,
        fecha_fin: tripData.fecha_fin,
      })
      .select()
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return { error }
    }

    // Refetch all trips
    await get().fetchTrips(userId)
    set({ loading: false })
    return { data }
  },

  /**
   * Delete a trip
   */
  deleteTrip: async (tripId, userId) => {
    const { error } = await supabase
      .from('viajes')
      .delete()
      .eq('id', tripId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set((state) => ({
      trips: state.trips.filter((t) => t.id !== tripId),
      currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
    }))
    return { success: true }
  },

  /**
   * Add a prenda to a trip's suitcase
   */
  addPrendaToTrip: async (tripId, prendaId) => {
    const { error } = await supabase
      .from('viaje_prendas')
      .insert({ viaje_id: tripId, prenda_id: prendaId, empacado: false })

    if (error) {
      if (error.code === '23505') {
        return { error: { message: 'Esta prenda ya está en la maleta' } }
      }
      set({ error: error.message })
      return { error }
    }

    // Refetch trip to get updated prendas
    await get().fetchTrip(tripId)
    return { success: true }
  },

  /**
   * Remove a prenda from a trip's suitcase
   */
  removePrendaFromTrip: async (tripId, prendaId) => {
    const { error } = await supabase
      .from('viaje_prendas')
      .delete()
      .eq('viaje_id', tripId)
      .eq('prenda_id', prendaId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    await get().fetchTrip(tripId)
    return { success: true }
  },

  /**
   * Toggle empacado (packed) status for a prenda in a trip
   */
  togglePacked: async (tripId, prendaId, currentValue) => {
    const { error } = await supabase
      .from('viaje_prendas')
      .update({ empacado: !currentValue })
      .eq('viaje_id', tripId)
      .eq('prenda_id', prendaId)

    if (error) {
      set({ error: error.message })
      return { error }
    }

    // Optimistic update
    set((state) => {
      if (!state.currentTrip) return state
      return {
        currentTrip: {
          ...state.currentTrip,
          prendas: state.currentTrip.prendas.map((p) =>
            p.id === prendaId ? { ...p, empacado: !currentValue } : p
          ),
        },
      }
    })
    return { success: true }
  },

  clearCurrentTrip: () => set({ currentTrip: null }),
}))
