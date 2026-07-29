const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listQuery = `
  SELECT s.*, e.name AS employee_name
  FROM salaries s
  LEFT JOIN employees e ON e.id = s.employee_id
`;

router.get('/', async (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE e.name ILIKE ? OR CAST(s.amount AS TEXT) ILIKE ? OR s.payment_frequency ILIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.effective_from DESC, s.id DESC';
  try {
    const data = await prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prepare(`${listQuery} WHERE s.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, amount, effective_from, payment_frequency, notes } = req.body;
  if (!employee_id || amount === undefined || !effective_from) {
    return res.status(400).json({ error: 'Employee, amount, and effective from date are required' });
  }

  try {
    const employee = await prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
    if (!employee) return res.status(400).json({ error: 'Invalid employee' });

    const result = await prepare(
      `INSERT INTO salaries (employee_id, amount, effective_from, payment_frequency, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(employee_id, amount, effective_from, payment_frequency || 'monthly', notes || null);

    const newSalary = await prepare(`${listQuery} WHERE s.id = ?`).get(result.lastInsertRowid);
    res.status(201).json(newSalary);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prepare('SELECT id FROM salaries WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { employee_id, amount, effective_from, payment_frequency, notes } = req.body;
    if (!employee_id || amount === undefined || !effective_from) {
      return res.status(400).json({ error: 'Employee, amount, and effective from date are required' });
    }

    await prepare(
      `UPDATE salaries SET employee_id = ?, amount = ?, effective_from = ?, payment_frequency = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(employee_id, amount, effective_from, payment_frequency || 'monthly', notes || null, req.params.id);

    const updatedSalary = await prepare(`${listQuery} WHERE s.id = ?`).get(req.params.id);
    res.json(updatedSalary);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prepare('DELETE FROM salaries WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
