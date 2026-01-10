import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config, validateConfig } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import database from './config/database.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Validate configuration on startup
try {
  validateConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await database.healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ok' : 'degraded',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', notFoundHandler);
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
    ========================================
    ACENEXA CBT Backend Server
    ========================================
    Environment: ${config.nodeEnv}
    Port: ${PORT}
    Database: ${database.getClient() ? 'Connected' : 'Not Connected'}
    Frontend URL: ${config.frontendUrl}
    ========================================
  `);
});

export default app;
