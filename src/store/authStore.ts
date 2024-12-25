import { create } from 'zustand'
import { User } from '../types'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, companyName: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) throw signInError

    if (!authData.user) throw new Error('No user data returned')

    // Get the client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (clientError) throw clientError

    set({
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        companyName: clientData.company_name,
        role: 'client'
      }
    })
  },
  signUp: async (email: string, password: string, companyName: string) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (signUpError) throw signUpError

    if (!authData.user) throw new Error('No user data returned')

    // Create the client record
    const { error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          id: authData.user.id,
          company_name: companyName,
        }
      ])

    if (clientError) throw clientError

    set({
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        companyName,
        role: 'client'
      }
    })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
  setUser: (user) => set({ user, loading: false }),
}))