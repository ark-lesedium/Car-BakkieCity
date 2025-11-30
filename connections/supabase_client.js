// supabase.js

// 1️⃣ Add your Supabase credentials
const SUPABASE_URL = "https://sgrxsnmewjlhxtdhnnsh.supabase.co";  // Replace with your Supabase URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncnhzbm1ld2psaHh0ZGhubnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzYxODcsImV4cCI6MjA3NzYxMjE4N30.fBqyxlaTyNMJQ55i8SIoz5xuNuX_rwZ-WlNUpz-Wdvk";                         // Replace with your anon/public key

// 2️⃣ Helper to lazily create Supabase client from the UMD global or via dynamic ESM import
let _cachedClient = null;
async function getSupabaseClient() {
  if (_cachedClient) return _cachedClient;

  // Prefer the UMD global if available (site might include the script tag)
  if (typeof window !== 'undefined' && window.supabase) {
    try {
      _cachedClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return _cachedClient;
    } catch (err) {
      console.warn('Failed to create supabase client from window.supabase, falling back to ESM import', err);
    }
  }

  // As a fallback, dynamically import the ESM bundle from jsDelivr and create a client
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const { createClient } = mod;
    _cachedClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    return _cachedClient;
  } catch (err) {
    console.error('Failed to dynamically import supabase ESM client:', err);
    return null;
  }
}

// 3️⃣ Fetch all cars from the database
async function fetchCars() {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('Supabase client not available. Make sure the supabase script is loaded before importing this module.');
      return null; // return null to indicate a fetch failure (so UI can show an error)
    }

    // select explicit columns that match the `cars` table schema exactly
    const { data, error } = await client
      .from("cars")
      .select(
        `id, make, model, variant, year, vin, registration_number, engine_type, engine_size, horsepower, torque, transmission, drivetrain, fuel_consumption, top_speed, doors, seats, body_type, color, interior_color, air_conditioning, sunroof, notch_bars, entertainment_system, main_image_url, gallery_images, price, currency, availability_status, location, date_added, last_updated, tags, mileage`
      )
      .order("date_added", { ascending: false }); // newest first

    if (error) {
      console.error("Error fetching cars:", error);
      return null; // return null on error so caller can surface the failure
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error:", err);
    return [];
  }
}

// Fetch a single car by id
async function fetchCarById(id) {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('Supabase client not available. Make sure the supabase script is loaded.');
      return null;
    }

    const { data, error } = await client
      .from('cars')
      .select(
        `id, make, model, variant, year, vin, registration_number, engine_type, engine_size, horsepower, torque, transmission, drivetrain, fuel_consumption, top_speed, doors, seats, body_type, color, interior_color, air_conditioning, sunroof, notch_bars, entertainment_system, main_image_url, gallery_images, price, currency, availability_status, location, date_added, last_updated, tags, mileage`
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching car by id:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('Unexpected error in fetchCarById:', err);
    return null;
  }
}

// 4️⃣ Export functions (optional, if using modules)
export { fetchCars, fetchCarById };

// Fetch cars with filters. Supported filters: { make, model, min_price, max_price, year, query }
async function fetchCarsFiltered(filters = {}) {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('Supabase client not available. Make sure the supabase script is loaded.');
      return null;
    }

    let query = client
      .from('cars')
      .select(
        `id, make, model, variant, year, vin, registration_number, engine_type, engine_size, horsepower, torque, transmission, drivetrain, fuel_consumption, top_speed, doors, seats, body_type, color, interior_color, air_conditioning, sunroof, notch_bars, entertainment_system, main_image_url, gallery_images, price, currency, availability_status, location, date_added, last_updated, tags, mileage`
      );

    if (filters.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }
    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }
    if (filters.year) {
      const y = Number(filters.year);
      if (!Number.isNaN(y)) query = query.eq('year', y);
    }
    if (filters.min_price) {
      const p = Number(filters.min_price);
      if (!Number.isNaN(p)) query = query.gte('price', p);
    }
    if (filters.max_price) {
      const p = Number(filters.max_price);
      if (!Number.isNaN(p)) query = query.lte('price', p);
    }
    if (filters.query) {
      const q = filters.query;
      // search across make, model, variant
      query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%,variant.ilike.%${q}%`);
    }

    query = query.order('date_added', { ascending: false }).limit(100);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching filtered cars:', error);
      return null;
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in fetchCarsFiltered:', err);
    return null;
  }
}

export { fetchCarsFiltered };

// Fetch a paginated page of cars. Returns { data, count }
// page: 1-based page number, perPage: items per page
async function fetchCarsPage({ filters = {}, page = 1, perPage = 20 } = {}) {
  try {
    const client = await getSupabaseClient();
    if (!client) return { data: null, count: 0 };

    const cols = `id, make, model, variant, year, vin, registration_number, engine_type, engine_size, horsepower, torque, transmission, drivetrain, fuel_consumption, top_speed, doors, seats, body_type, color, interior_color, air_conditioning, sunroof, notch_bars, entertainment_system, main_image_url, gallery_images, price, currency, availability_status, location, date_added, last_updated, tags, mileage`;

    let q = client.from('cars').select(cols, { count: 'exact' });

    if (filters.make) q = q.ilike('make', `%${filters.make}%`);
    if (filters.model) q = q.ilike('model', `%${filters.model}%`);
    if (filters.year) {
      const y = Number(filters.year);
      if (!Number.isNaN(y)) q = q.eq('year', y);
    }
    if (filters.min_price) {
      const p = Number(filters.min_price);
      if (!Number.isNaN(p)) q = q.gte('price', p);
    }
    if (filters.max_price) {
      const p = Number(filters.max_price);
      if (!Number.isNaN(p)) q = q.lte('price', p);
    }
    if (filters.query) {
      const qq = filters.query;
      q = q.or(`make.ilike.%${qq}%,model.ilike.%${qq}%,variant.ilike.%${qq}%`);
    }

    q = q.order('date_added', { ascending: false });

    const from = (page - 1) * perPage;
    const to = page * perPage - 1;
    const { data, error, count } = await q.range(from, to);

    if (error) {
      console.error('Error fetching cars page:', error);
      return { data: null, count: 0 };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error('Unexpected error in fetchCarsPage:', err);
    return { data: null, count: 0 };
  }
}

export { fetchCarsPage };
