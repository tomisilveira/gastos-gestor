import { createClient } from '@supabase/supabase-js'

// Usar variables de entorno o valores directos
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://TU_PROYECTO.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'TU_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)