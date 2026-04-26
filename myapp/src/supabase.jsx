import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ehocckmjsdsxdcdkgrgk.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2Nja21qc2RzeGRjZGtncmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDU0NjksImV4cCI6MjA5MjI4MTQ2OX0.JsxWHvTHyZ_BaLSPMa7gXNsiit0gqi_JYR64qwe_ayQ"

export const supabase = createClient(supabaseUrl, supabaseKey)
