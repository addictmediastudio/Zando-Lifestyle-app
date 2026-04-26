import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kufvydwuoveeigxsdmle.supabase.co"
const supabaseKey = "sb_publishable_A_9YrdcKbrAEfYxikXJcQg_C3bfPaRP"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  console.log('Fetching products from:', supabaseUrl)
  const { data, error } = await supabase.from('products').select('*')
  if (error) {
    console.error('Error fetching products:', error)
  } else {
    console.log('Products count:', data?.length ?? 0)
    if (data && data.length > 0) {
      console.log('First product sample:', {
        id: data[0].id,
        name: data[0].name,
        position: data[0].position
      })
    }
  }
}

checkProducts()
