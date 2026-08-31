require('dotenv').config();
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

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
