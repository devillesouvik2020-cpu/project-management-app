const express = require('express');
const cors = require('cors');
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

async function startServer() {
  await initDatabase();

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
