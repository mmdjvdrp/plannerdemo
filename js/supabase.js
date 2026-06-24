// js/supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://ipureiqnhgatigewbggj.supabase.co"; 
const supabaseKey = "sb_publishable_ieckfcaUPxIeHPloSuR-rA_r7BC3aso"; 

export const supabase = createClient(supabaseUrl, supabaseKey);
