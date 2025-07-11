/* ================ [ IMPORTS ] ================ */

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useCampaignStore } from "./campaignStore";

/* ================ [ TYPES ] ================ */

interface AuthState {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
  // signInWithEmail: (email: string, password: string) => Promise<any>;
  // signUpWithEmail: (email: string, password: string) => Promise<any>;
  // signInWithProvider: (provider: "google" | "discord") => Promise<any>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Fetch the most recently updated campaign
  const fetchLatestCampaign = async (userId: string) => {
    const { data, error } = await supabase.from("campaigns")
      .select("*")
      .eq("client_id", userId)
      .order("updated_at", { ascending: false }) // Sort by latest update
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest campaign:", error);
      return;
    }

    if (data) {
      // useCampaignStore.getState().setCurrentCampaign(data);
    }
  };

  // Function to load session manually
  const checkUser = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error fetching session:", error);
    }

    set({ user: session?.user || null, loading: false });
  };

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`Auth event: ${event}`, session);

    if (session) {
      localStorage.setItem("supabase_session", JSON.stringify(session)); // Store session manually
    } else {
      localStorage.removeItem("supabase_session"); // Remove session on sign-out
    }

    set({ user: session?.user || null });

    if (event === "SIGNED_IN" && session?.user) {
      setTimeout(() => ensureClientExists(session.user), 0);
    }
  });

  // Ensure user exists in Supabase DB
  async function ensureClientExists(user: any) {
    if (!user) return;

    const googleAvatar = user.user_metadata?.avatar_url ?? null;
    const discordIdentity = user.identities?.find(
      (id: any) => id.provider === "discord",
    );
    const discordAvatar =
      discordIdentity?.identity_data?.id &&
      discordIdentity?.identity_data?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordIdentity.identity_data.id}/${discordIdentity.identity_data.avatar}.png`
        : null;

    const profilePicture = googleAvatar || discordAvatar || null;

    try {
      const { data: existingClient, error: checkError } =
        await supabase.from("clients")
          .select("id")
          .eq("id", user.id)
          .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(
          `Error checking client existence: ${checkError.message}`,
        );
      }

      if (!existingClient) {
        await supabase.from("clients").insert([
          { id: user.id, profile_picture: profilePicture },
        ]);
      } else if (profilePicture) {
        await supabase.from("clients")
          .update({ profile_picture: profilePicture })
          .eq("id", user.id);
      }
      await fetchLatestCampaign(user.id);
    } catch (error) {
      console.error("Error ensuring client existence:", error);
    }
  }

  checkUser(); // Check session on load

  return {
    user: null,
    loading: true,
    setUser: (user) => set({ user }),

    // signInWithEmail: async (email, password) => {
    //   const { data, error } = await supabase.auth.signInWithPassword({
    //     email,
    //     password,
    //   });
    //   if (error) {
    //     console.error("Email sign-in error:", error);
    //   } else {
    //     set({ user: data.user });
    //     localStorage.setItem("supabase_session", JSON.stringify(data.session)); // Store session
    //   }

    //   return { error }
    // },

    // signUpWithEmail: async (email, password) => {
    //   const { data, error } = await supabase.auth.signUp({
    //     email,
    //     password,
    //   });

    //   if (!error) {
    //     set({ user: data.user });
    //     localStorage.setItem("supabase_session", JSON.stringify(data.session));
    //   }

    //   return { error }
    // },

    // signInWithProvider: async (provider) => {
    //   const { data, error } = await supabase.auth.signInWithOAuth({
    //     provider,
    //     options: {
    //       redirectTo: `${window.location.origin}/dashboard`,
    //       skipBrowserRedirect: true,
    //     },
    //   });

    //   if (error) {
    //     console.error("OAuth Sign-in error:", error);
    //   } else if (data?.url) {
    //     window.location.href = data.url;
    //   }

    //   return { error }
    // },

    signOut: async () => {
      await supabase.auth.signOut();
      useCampaignStore.getState().setCurrentCampaign(null);
      localStorage.removeItem("campaign-storage");
      localStorage.removeItem("supabase_session");
      set({ user: null });
    },
  };
});
