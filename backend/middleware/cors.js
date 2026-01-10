import cors from 'cors';
import { config } from '../config/env.js';

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In production, block unknown origins
    if (config.nodeEnv === 'production') {
      return callback(new Error('Not allowed by CORS'), false);
    }

    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
});
