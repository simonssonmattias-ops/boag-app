abase · JS
import { createClient } from '@supabase/supabase-js'
 
const URL = 'https://xybfafzonmadtikzrysr.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5YmZhZnpvbm1hZHRpa3pyeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjkyODMsImV4cCI6MjA5MjUwNTI4M30.mO1E8LTraXnTLkcCKPMOXHK0kviQZjasAipEOV5Dq8Y'
 
export const supabase = createClient(URL, KEY, {
  global: {
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`
    }
  }
})
 
