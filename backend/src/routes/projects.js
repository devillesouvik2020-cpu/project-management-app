const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listQuery = `
  SELECT p.*, c.name AS client_name
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
`;

router.get('/', (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE p.name LIKE ? OR p.details LIKE ? OR c.name LIKE ? OR p.status LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.start_date DESC, p.id DESC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = prepare(`${listQuery} WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { client_id, name, details, start_date, status } = req.body;
  if (!client_id || !name?.trim() || !start_date) {
    return res.status(400).json({ error: 'Client, project name, and start date are required' });
  }

  const client = prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
  if (!client) return res.status(400).json({ error: 'Invalid client' });

  const result = prepare(
    `INSERT INTO projects (client_id, name, details, start_date, status, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(client_id, name.trim(), details || null, start_date, status || 'active');

  res.status(201).json(prepare(`${listQuery} WHERE p.id = ?`).get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { client_id, name, details, start_date, status } = req.body;
  if (!client_id || !name?.trim() || !start_date) {
    return res.status(400).json({ error: 'Client, project name, and start date are required' });
  }

  prepare(
    `UPDATE projects SET client_id = ?, name = ?, details = ?, start_date = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(client_id, name.trim(), details || null, start_date, status || 'active', req.params.id);

  res.json(prepare(`${listQuery} WHERE p.id = ?`).get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
