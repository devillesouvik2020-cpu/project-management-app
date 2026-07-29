const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const search = req.query.search?.trim();
  let query = 'SELECT * FROM clients';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ? OR address LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, contact_email, contact_phone, address } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Client name is required' });

  const result = prepare(
    `INSERT INTO clients (name, contact_email, contact_phone, address, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(name.trim(), contact_email || null, contact_phone || null, address || null);

  res.status(201).json(prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = prepare('SELECT id FROM clients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, contact_email, contact_phone, address } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Client name is required' });

  prepare(
    `UPDATE clients SET name = ?, contact_email = ?, contact_phone = ?, address = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name.trim(), contact_email || null, contact_phone || null, address || null, req.params.id);

  res.json(prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
