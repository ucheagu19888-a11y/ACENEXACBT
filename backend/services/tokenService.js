import crypto from 'crypto';
import database from '../config/database.js';

class TokenService {
  generateTokenCode(prefix = 'ACE') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const length = 12;
    const randomBytes = crypto.randomBytes(length);

    let result = '';
    for (let i = 0; i < length; i++) {
      const index = randomBytes[i] % chars.length;
      result += chars[index];
    }

    return `${prefix}-${result.slice(0, 4)}-${result.slice(4, 8)}-${result.slice(8, 12)}`;
  }

  async createToken(tokenData) {
    const supabase = database.getClient();
    const tokenCode = this.generateTokenCode('ACE');

    const { data, error } = await supabase
      .from('access_tokens')
      .insert([{
        token_code: tokenCode,
        is_active: true,
        device_fingerprint: null,
        metadata: tokenData,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTokenByCode(tokenCode) {
    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('token_code', tokenCode)
      .single();

    if (error) throw error;
    return data;
  }

  async getAllTokens(limit = 50) {
    const supabase = database.getClient();
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async updateToken(tokenCode, updates) {
    const supabase = database.getClient();
    const { error } = await supabase
      .from('access_tokens')
      .update(updates)
      .eq('token_code', tokenCode);

    if (error) throw error;
  }

  async deleteToken(tokenCode) {
    const supabase = database.getClient();
    const { error } = await supabase
      .from('access_tokens')
      .delete()
      .eq('token_code', tokenCode);

    if (error) throw error;
  }

  async checkTokenExpiry(token) {
    if (!token.expires_at) return { valid: true };

    const expiryDate = new Date(token.expires_at);
    const now = new Date();

    if (now > expiryDate) {
      return {
        valid: false,
        message: `Access Code Expired! This code expired on ${expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`
      };
    }

    const diffTime = expiryDate - now;
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      valid: true,
      remainingDays,
      expiresAt: token.expires_at,
    };
  }
}

export default new TokenService();
