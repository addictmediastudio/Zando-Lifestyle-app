import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kufvydwuoveeigxsdmle.supabase.co"
const supabaseKey = "sb_publishable_A_9YrdcKbrAEfYxikXJcQg_C3bfPaRP"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin() {
  console.log('Checking admin role...')
  const { data, error } = await supabase.from('user_roles').select('*').eq('role', 'admin')
  
  if (error) {
    console.error('Error fetching admin role:', error)
  } else {
    console.log('Admin roles count:', data.length)
    if (data.length > 0) {
      console.log('Admin user IDs:', data.map(d => d.user_id))
    }
  }
}

checkAdmin()
