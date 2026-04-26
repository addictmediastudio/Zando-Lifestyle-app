import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kufvydwuoveeigxsdmle.supabase.co"
const supabaseKey = "sb_publishable_A_9YrdcKbrAEfYxikXJcQg_C3bfPaRP"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
  console.log('Testing query with order by position...')
  const res = await supabase.from("products").select("*").order("position", { ascending: true })
  
  if (res.error) {
    console.error('Query error:', res.error)
  } else {
    console.log('Query success, count:', res.data.length)
    if (res.data.length > 0) {
        console.log('Fields in first row:', Object.keys(res.data[0]))
    }
  }
}

testQuery()
