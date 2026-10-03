import { create } from 'zustand'
import { supabase, cancelSessionRequests } from '../lib/supabase'
import { clearPrivateMedia, deletePhoto } from '../lib/privateMedia'
import { mediaReference } from '../lib/mediaReference'
import { clearPersonalCaches } from '../lib/sessionCleanup'
import { useClothingStore } from './useClothingStore'
import { useOutfitStore } from './useOutfitStore'
import { useCalendarStore } from './useCalendarStore'
import { useLookStore } from './useLookStore'
import { useTripStore } from './useTripStore'
import { useWishlistStore } from './useWishlistStore'

function resetPersonalData() {
  cancelSessionRequests()
  clearPrivateMedia()
  for (const store of [useClothingStore, useOutfitStore, useCalendarStore, useLookStore, useTripStore, useWishlistStore]) {
    store.setState(store.getInitialState(), true)
  }
  void clearPersonalCaches().catch(() => {})
}

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null })

      if (session?.user) {
        await get().fetchProfile(session.user.id)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          const changed = get().user?.id !== session?.user?.id
          if (changed) resetPersonalData()
          set({ session, user: session?.user ?? null, ...(changed ? { profile: null } : {}) })
          // Avoid awaiting Supabase requests while its auth callback holds the lock.
          if (session?.user) setTimeout(() => {
            if (get().user?.id === session.user.id) void get().fetchProfile(session.user.id)
          }, 0)
        }
      )

      set({ loading: false })
      return subscription
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchProfile: async (userId) => {
    // Use maybeSingle() instead of single() to avoid throwing 406 Not Acceptable if row is missing
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (get().user?.id !== userId) return

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    // Auto-heal fallback: if session exists but profile row doesn't, create it now that we are authenticated
    if (!data) {
      const nombreMeta = get().session?.user?.user_metadata?.nombre || 'Usuario'
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nombre: nombreMeta,
          onboarding_completado: false
        })
        .select()
        .maybeSingle()

      if (createError) {
        if (createError.code === '23505') {
          // Unique key violation means the database trigger already inserted the profile concurrently.
          // We'll simply refetch it.
          const { data: refetchedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          if (get().user?.id === userId) set({ profile: refetchedProfile })
        } else {
          console.error('Error creating missing profile on-the-fly:', createError)
        }
        return
      }
      if (get().user?.id === userId) set({ profile: newProfile })
    } else {
      set({ profile: data })
    }
  },

  signUp: async (email, password, nombre) => {
    set({ error: null, loading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }
      }
    })

    if (error) {
      set({ error: error.message, loading: false })
      return { error }
    }

    // Note: The profile is automatically created in the database by the PostgreSQL trigger 'on_auth_user_created'.
    // We don't perform a manual insert here to avoid redundant requests and browser console 409 (Conflict) warnings.

    set({ loading: false })
    return { data }
  },

  signIn: async (email, password) => {
    set({ error: null, loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ error: error.message, loading: false })
      return { error }
    }

    set({ loading: false })
    return { data }
  },

  resetPasswordForEmail: async (email) => {
    set({ error: null })
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      set({ error: error.message })
      return { error }
    }

    return { data }
  },

  updatePassword: async (newPassword) => {
    set({ error: null })
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      set({ error: error.message })
      return { error }
    }

    return { data }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) return { error }
    resetPersonalData()
    await clearPersonalCaches().catch(() => {})
    set({ session: null, user: null, profile: null })
    return { success: true }
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      return { error }
    }

    set({ profile: data })
    return { data }
  },

  uploadAvatar: async (imageFile) => {
    set({ loading: true, error: null })
    try {
      const userId = get().user?.id
      if (!userId) throw new Error('Usuario no autenticado')

      const previousPhoto = get().profile?.foto_url
      const fileExt = imageFile.type === 'image/webp' ? 'webp' : 'jpg'
      const fileName = `${userId}/avatar-${crypto.randomUUID()}.${fileExt}`

      // A new reference also refreshes mounted images without a stale browser cache.
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(fileName, imageFile, {
          cacheControl: '0',
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      clearPrivateMedia()
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: mediaReference('avatares', fileName) })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        await supabase.storage.from('avatares').remove([fileName])
        throw updateError
      }

      set({ profile: data, loading: false })
      try { await deletePhoto(previousPhoto) } catch { return { data, warning: 'Tu foto se actualizó, pero no se pudo borrar la anterior del almacenamiento.' } }
      return { data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { error }
    }
  },
}))
