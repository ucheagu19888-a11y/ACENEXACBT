import { createClient } from '@supabase/supabase-js';

class Database {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('CRITICAL: Missing Supabase credentials in Environment Variables.');
      throw new Error('Database configuration error');
    }

    this.client = createClient(
      this.supabaseUrl,
      this.supabaseKey,
      { auth: { persistSession: false } }
    );
  }

  getClient() {
    return this.client;
  }

  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (err) {
      return false;
    }
  }
}

export default new Database();
