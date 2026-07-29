const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listQuery = `
  SELECT a.*, e.name AS employee_name
  FROM attendance a
  LEFT JOIN employees e ON e.id = a.employee_id
`;

router.get('/', async (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE e.name ILIKE ? OR a.status ILIKE ? OR a.notes ILIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY a.attendance_date DESC, a.id DESC';
  try {
    const data = await prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prepare(`${listQuery} WHERE a.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, attendance_date, status, check_in, check_out, notes } = req.body;
  if (!employee_id || !attendance_date || !status) {
    return res.status(400).json({ error: 'Employee, date, and status are required' });
  }

  try {
    const employee = await prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
    if (!employee) return res.status(400).json({ error: 'Invalid employee' });

    const result = await prepare(
      `INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(employee_id, attendance_date, status, check_in || null, check_out || null, notes || null);

    const newRecord = await prepare(`${listQuery} WHERE a.id = ?`).get(result.lastInsertRowid);
    res.status(201).json(newRecord);
  } catch (error) {
    // Unique constraint violation in Postgres yields error code 23505
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE constraint'))) {
      return res.status(400).json({ error: 'Attendance record already exists for this employee on this date' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prepare('SELECT id FROM attendance WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { employee_id, attendance_date, status, check_in, check_out, notes } = req.body;
    if (!employee_id || !attendance_date || !status) {
      return res.status(400).json({ error: 'Employee, date, and status are required' });
    }

    await prepare(
      `UPDATE attendance SET employee_id = ?, attendance_date = ?, status = ?, check_in = ?, check_out = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(employee_id, attendance_date, status, check_in || null, check_out || null, notes || null, req.params.id);

    const updatedRecord = await prepare(`${listQuery} WHERE a.id = ?`).get(req.params.id);
    res.json(updatedRecord);
  } catch (error) {
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE constraint'))) {
      return res.status(400).json({ error: 'Attendance record already exists for this employee on this date' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
