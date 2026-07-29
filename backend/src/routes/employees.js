const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const search = req.query.search?.trim();
  let query = 'SELECT * FROM employees';
  const params = [];

  if (search) {
    query +=
      ' WHERE name LIKE ? OR designation LIKE ? OR place_of_posting LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, date_of_joining, designation, place_of_posting, contact_email, contact_phone } = req.body;
  if (!name?.trim() || !date_of_joining || !designation?.trim()) {
    return res.status(400).json({ error: 'Name, date of joining, and designation are required' });
  }

  const result = prepare(
    `INSERT INTO employees (name, date_of_joining, designation, place_of_posting, contact_email, contact_phone, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    name.trim(),
    date_of_joining,
    designation.trim(),
    place_of_posting || null,
    contact_email || null,
    contact_phone || null
  );

  res.status(201).json(prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, date_of_joining, designation, place_of_posting, contact_email, contact_phone } = req.body;
  if (!name?.trim() || !date_of_joining || !designation?.trim()) {
    return res.status(400).json({ error: 'Name, date of joining, and designation are required' });
  }

  prepare(
    `UPDATE employees SET name = ?, date_of_joining = ?, designation = ?, place_of_posting = ?,
     contact_email = ?, contact_phone = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    name.trim(),
    date_of_joining,
    designation.trim(),
    place_of_posting || null,
    contact_email || null,
    contact_phone || null,
    req.params.id
  );

  res.json(prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
