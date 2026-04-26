import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kufvydwuoveeigxsdmle.supabase.co"
const supabaseKey = "sb_publishable_A_9YrdcKbrAEfYxikXJcQg_C3bfPaRP"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  console.log('Checking profiles...')
  const { data, error } = await supabase.from('profiles').select('*')
  
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles count:', data.length)
    if (data.length > 0) {
      console.log('Profile samples:', data.slice(0, 3).map(d => ({ email: d.email, name: d.name })))
    }
  }
}

checkProfiles()
