import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'discord') => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, loading: false });
  };

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ user: session?.user || null });
  });

  return {
    user: null,
    loading: true,
    setUser: (user) => set({ user }),

    signInWithEmail: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Email sign-in error:', error);
      } else {
        set({ user: data.user });
      }
    },

    signUpWithEmail: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Sign-up error:', error);
      } else {
        set({ user: data.user });
      }
    },

    signInWithProvider: async (provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) console.error('OAuth Sign-in error:', error);
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ user: null });
    },
  };
});
