/* ================ [ IMPORTS ] ================ */

import { createClient } from "@supabase/supabase-js";

/* ================ [ SUPABASE ] ================ */

// Grab from dotenv
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client
const supabase = createClient(
  SUPABASE_URL ?? "https://invalid.invalid/",
  SUPABASE_ANON_KEY ?? "invalid",
);

/* ================ [ EXPORTS ] ================ */

export { supabase };
