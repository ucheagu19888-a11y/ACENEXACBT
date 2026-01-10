import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

  // Payment
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // CORS
  allowedOrigins: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean),
};

export const validateConfig = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
