import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://xybfafzonmadtikzryor.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5YmZhZnpvbm1hZHRpa3pyeXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjkyODMsImV4cCI6MjA5MjUwNTI4M30.mO1E8LTraXnTLkcCKPMOXHK0kviQZjasAipEOV5Dq8Y'
)
