// supabase.js
console.log("retrieving supabase client")
import { createClient } from '@supabase/supabase-js';

import { config } from 'dotenv';
  
if (!process.env.PORT) {
  console.log("loading .env")

  // Load .env from the script's directory
  console.log(config());
  //config({ path: '../.env' });
  console.log("PORT: "+process.env.PORT)
}

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
