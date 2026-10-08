require('dotenv').config();
const { validateEnv } = require('./lib/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');

const { initWebPush } = require('./services/notifications');
const { startScheduler } = require('./services/scheduler');

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const tasksRoutes = require('./routes/tasks');
const pushRoutes = require('./routes/push');
const chatRoutes = require('./routes/chat');

const app = express();

// ── Middleware ─────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile native, health checks, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow Capacitor mobile apps, local dev, and vercel deployments
    if (
      origin.startsWith('capacitor://') ||
      origin.startsWith('ionic://') ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

initWebPush();
startScheduler();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
