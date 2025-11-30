import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgrxsnmewjlhxtdhnnsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncnhzbm1ld2psaHh0ZGhubnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzYxODcsImV4cCI6MjA3NzYxMjE4N30.fBqyxlaTyNMJQ55i8SIoz5xuNuX_rwZ-WlNUpz-Wdvk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  try {
    console.log('Querying supabase for cars (limit 10)...');
    const { data, error, count } = await supabase.from('cars').select('*', { count: 'exact' }).limit(10);
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Total rows (count):', count);
      console.log('Returned rows:', Array.isArray(data) ? data.length : 0);
      console.log('First rows sample:', JSON.stringify(data ? data.slice(0,5) : [], null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
