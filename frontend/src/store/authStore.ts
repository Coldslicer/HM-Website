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

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`Auth event: ${event}`, session); // Debugging log
    set({ user: session?.user || null });

    if (event === 'SIGNED_IN' && session?.user) {
        // Ensure client entry exists & update profile picture
        setTimeout(() => ensureClientExists(session.user), 0);
    }
  });

  // Function to ensure the user exists in the "clients" table
  async function ensureClientExists(user: any) {
    if (!user) return;

    // Get the user's profile picture
    const googleAvatar = user.user_metadata?.avatar_url ?? null;

    const discordIdentity = user.identities?.find((id: any) => id.provider === 'discord');
    const discordAvatar =
      discordIdentity?.identity_data?.id && discordIdentity?.identity_data?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordIdentity.identity_data.id}/${discordIdentity.identity_data.avatar}.png`
        : null;

    const profilePicture = googleAvatar || discordAvatar || null;

    console.log("Checking if client exists in Supabase...");

    try {
      // Check if client exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Ignore "no rows found" error (PGRST116), but log other errors
        throw new Error(`Error checking client existence: ${checkError.message}`);
      }

      if (!existingClient) {
        console.log("Client does not exist. Creating new entry...");

        // Insert new client entry
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{ id: user.id, profile_picture: profilePicture }]);

        if (insertError) {
          throw new Error(`Failed to insert client: ${insertError.message}`);
        }

        console.log("New client entry created successfully.");
      } else if (profilePicture) {
        console.log("Client exists. Updating profile picture...");

        // Update profile picture
        const { error: updateError } = await supabase
          .from('clients')
          .update({ profile_picture: profilePicture })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Failed to update profile picture: ${updateError.message}`);
        }

        console.log("Profile picture updated successfully.");
      }
    } catch (error) {
      console.error("Error ensuring client existence:", error);
    }
  }

  checkUser(); // Ensures the user state is set on load

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
