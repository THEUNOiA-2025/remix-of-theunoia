import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.argv[2],
  process.argv[3]
)

async function checkColleges() {
  const { count, error } = await supabase
    .from('colleges')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching colleges count:', error)
    process.exit(1)
  }
  
  console.log('---COLLEGE_COUNT:' + (count || 0))
  
  if (count === 0) {
    console.log('Database is empty!')
  } else {
    const { data } = await supabase.from('colleges').select('state').limit(10)
    console.log('Sample states in DB:', data?.map(d => d.state))
  }
}

checkColleges()
