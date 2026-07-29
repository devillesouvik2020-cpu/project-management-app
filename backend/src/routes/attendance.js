const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listQuery = `
  SELECT a.*, e.name AS employee_name, e.designation, e.place_of_posting
  FROM attendance a
  LEFT JOIN employees e ON e.id = a.employee_id
`;

router.get('/', (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE e.name LIKE ? OR e.designation LIKE ? OR a.status LIKE ? OR a.attendance_date LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY a.attendance_date DESC, a.id DESC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = prepare(`${listQuery} WHERE a.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { employee_id, attendance_date, status, check_in, check_out, notes } = req.body;
  if (!employee_id || !attendance_date || !status) {
    return res.status(400).json({ error: 'Employee, date, and status are required' });
  }

  const employee = prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
  if (!employee) return res.status(400).json({ error: 'Invalid employee' });

  try {
    const result = prepare(
      `INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(employee_id, attendance_date, status, check_in || null, check_out || null, notes || null);

    res.status(201).json(prepare(`${listQuery} WHERE a.id = ?`).get(result.lastInsertRowid));
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('constraint')) {
      return res.status(400).json({ error: 'Attendance already recorded for this employee on this date' });
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const existing = prepare('SELECT id FROM attendance WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { employee_id, attendance_date, status, check_in, check_out, notes } = req.body;
  if (!employee_id || !attendance_date || !status) {
    return res.status(400).json({ error: 'Employee, date, and status are required' });
  }

  try {
    prepare(
      `UPDATE attendance SET employee_id = ?, attendance_date = ?, status = ?, check_in = ?, check_out = ?, notes = ?,
       updated_at = datetime('now') WHERE id = ?`
    ).run(employee_id, attendance_date, status, check_in || null, check_out || null, notes || null, req.params.id);

    res.json(prepare(`${listQuery} WHERE a.id = ?`).get(req.params.id));
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Attendance already recorded for this employee on this date' });
    }
    throw err;
  }
});

router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
