export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xjchklrrmyavizozhtpb.supabase.co'
  )
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqY2hrbHJybXlhdml6b3podHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzYzMDcsImV4cCI6MjA5NDE1MjMwN30.-jwzje0VXfmysMIff5yV_iYbpd7ndw1YEtM4Les30ok'
  )
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey())
}