import { create } from 'zustand';
import { SUPABASE_CLIENT } from '../lib/supabase';
import { useCampaignStore } from './campaignStore';

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
  const fetchUser = async () => {
    const { data, error } = await SUPABASE_CLIENT.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error);
    } else {
      set({ user: data?.user || null, loading: false });
    }
  };

  if (!window.__SUPABASE_AUTH_LISTENER__) {
    window.__SUPABASE_AUTH_LISTENER__ = true;
    SUPABASE_CLIENT.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`, session);
      set({ user: session?.user || null });
    });
  }

  fetchUser();

  return {
    user: null,
    loading: true,
    setUser: (user) => set({ user }),

    signInWithEmail: async (email, password) => {
      const { data, error } = await SUPABASE_CLIENT.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Email sign-in error:', error);
      } else {
        set({ user: data.user });
      }
    },

    signUpWithEmail: async (email, password) => {
      const { data, error } = await SUPABASE_CLIENT.auth.signUp({ email, password });
      if (error) {
        console.error('Sign-up error:', error);
      } else {
        set({ user: data.user });
      }
    },

    signInWithProvider: async (provider) => {
      const { data, error } = await SUPABASE_CLIENT.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('OAuth Sign-in error:', error);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    },

    signOut: async () => {
      await SUPABASE_CLIENT.auth.signOut();
      useCampaignStore.getState().setCurrentCampaign(null);
      set({ user: null });
    },
  };
});
