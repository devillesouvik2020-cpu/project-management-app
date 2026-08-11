const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const projectsRoutes = require('./routes/projects');
const billingRoutes = require('./routes/billing');
const paymentsRoutes = require('./routes/payments');
const transactionsRoutes = require('./routes/transactions');
const employeesRoutes = require('./routes/employees');
const salariesRoutes = require('./routes/salaries');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit origins from env (comma-separated), e.g. your DuckDNS domain(s)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

// Pattern-based: always allow any *.vercel.app preview URL and localhost
const allowedPatterns = [
  /^https:\/\/[\w-]+\.vercel\.app$/,   // any Vercel preview/production URL
  /^https?:\/\/localhost(:\d+)?$/,     // local dev
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // no-origin requests (curl, health checks)
  if (allowedOrigins.includes(origin)) return true;
  if (allowedPatterns.some((pattern) => pattern.test(origin))) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/salaries', salariesRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to init DB:', err);
      process.exit(1);
    });
}

module.exports = app;
