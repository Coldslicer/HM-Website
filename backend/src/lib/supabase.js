// supabase.js
import { createClient } from '@supabase/supabase-js';



export const supabase = createClient(process.env.SUPABASE_URL, 
process.env.SUPABASE_KEY);
const { data, error } = await supabase
      .from('backend_logins')
      .insert([
        {}
      ]);

if (error) {
    console.log("unable to connect to supabase");
} else {
    console.log("connected to supabase");
}
