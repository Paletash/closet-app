import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
        async (_event, session) => {
          set({ session, user: session?.user ?? null })
          if (session?.user) {
            await get().fetchProfile(session.user.id)
          } else {
            set({ profile: null })
          }
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
          set({ profile: refetchedProfile })
        } else {
          console.error('Error creating missing profile on-the-fly:', createError)
        }
        return
      }
      set({ profile: newProfile })
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

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
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

      // Avatars are stored in a dedicated folder for each user (user's UUID) inside the 'avatares' bucket
      const fileExt = 'jpg'
      const fileName = `${userId}/avatar.${fileExt}`

      // We'll upload to the dedicated 'avatares' bucket with upsert set to true to replace the old avatar
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatares')
        .getPublicUrl(fileName)

      // Update the profile with the new public URL
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: urlData.publicUrl })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      set({ profile: data, loading: false })
      return { data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { error }
    }
  },
}))
