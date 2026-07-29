const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listQuery = `
  SELECT s.*, e.name AS employee_name, e.designation
  FROM salaries s
  LEFT JOIN employees e ON e.id = s.employee_id
`;

router.get('/', (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE e.name LIKE ? OR e.designation LIKE ? OR s.notes LIKE ? OR CAST(s.amount AS TEXT) LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.effective_from DESC, s.id DESC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = prepare(`${listQuery} WHERE s.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { employee_id, amount, effective_from, payment_frequency, notes } = req.body;
  if (!employee_id || amount === undefined || !effective_from) {
    return res.status(400).json({ error: 'Employee, amount, and effective from date are required' });
  }

  const employee = prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
  if (!employee) return res.status(400).json({ error: 'Invalid employee' });

  const result = prepare(
    `INSERT INTO salaries (employee_id, amount, effective_from, payment_frequency, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(employee_id, amount, effective_from, payment_frequency || 'monthly', notes || null);

  res.status(201).json(prepare(`${listQuery} WHERE s.id = ?`).get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = prepare('SELECT id FROM salaries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { employee_id, amount, effective_from, payment_frequency, notes } = req.body;
  if (!employee_id || amount === undefined || !effective_from) {
    return res.status(400).json({ error: 'Employee, amount, and effective from date are required' });
  }

  prepare(
    `UPDATE salaries SET employee_id = ?, amount = ?, effective_from = ?, payment_frequency = ?, notes = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(employee_id, amount, effective_from, payment_frequency || 'monthly', notes || null, req.params.id);

  res.json(prepare(`${listQuery} WHERE s.id = ?`).get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM salaries WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
