const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const search = req.query.search?.trim();
  let query = 'SELECT * FROM clients';
  const params = [];

  if (search) {
    query += ' WHERE name ILIKE ? OR contact_email ILIKE ? OR contact_phone ILIKE ? OR address ILIKE ?';
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
    const row = await prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { name, contact_email, contact_phone, address } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Client name is required' });

  try {
    const result = await prepare(
      `INSERT INTO clients (name, contact_email, contact_phone, address, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(name.trim(), contact_email || null, contact_phone || null, address || null);

    const newClient = await prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prepare('SELECT id FROM clients WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { name, contact_email, contact_phone, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Client name is required' });

    await prepare(
      `UPDATE clients SET name = ?, contact_email = ?, contact_phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(name.trim(), contact_email || null, contact_phone || null, address || null, req.params.id);

    const updatedClient = await prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
