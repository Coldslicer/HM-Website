/* ================ [ SUPABASE ] ================ */

// Imports
import { createClient } from '@supabase/supabase-js'

// Grab from dotenv
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client
const SUPABASE_CLIENT = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export client
export { SUPABASE_CLIENT }
