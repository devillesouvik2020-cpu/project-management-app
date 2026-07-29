const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const search = req.query.search?.trim();
  let query = 'SELECT * FROM employees';
  const params = [];

  if (search) {
    query += ' WHERE name ILIKE ? OR designation ILIKE ? OR place_of_posting ILIKE ? OR contact_email ILIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC';
  try {
    const data = await prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { name, date_of_joining, designation, place_of_posting, contact_email, contact_phone } = req.body;
  if (!name?.trim() || !date_of_joining || !designation?.trim()) {
    return res.status(400).json({ error: 'Name, date of joining, and designation are required' });
  }

  try {
    const result = await prepare(
      `INSERT INTO employees (name, date_of_joining, designation, place_of_posting, contact_email, contact_phone, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      name.trim(),
      date_of_joining,
      designation.trim(),
      place_of_posting || null,
      contact_email || null,
      contact_phone || null
    );

    const newEmployee = await prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { name, date_of_joining, designation, place_of_posting, contact_email, contact_phone } = req.body;
    if (!name?.trim() || !date_of_joining || !designation?.trim()) {
      return res.status(400).json({ error: 'Name, date of joining, and designation are required' });
    }

    await prepare(
      `UPDATE employees SET name = ?, date_of_joining = ?, designation = ?, place_of_posting = ?, contact_email = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      name.trim(),
      date_of_joining,
      designation.trim(),
      place_of_posting || null,
      contact_email || null,
      contact_phone || null,
      req.params.id
    );

    const updatedEmployee = await prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
