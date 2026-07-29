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

router.get('/', async (req, res) => {
  const search = req.query.search?.trim();
  let query = listQuery;
  const params = [];

  if (search) {
    query += ` WHERE p.name ILIKE ? OR p.details ILIKE ? OR c.name ILIKE ? OR p.status ILIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.start_date DESC, p.id DESC';
  try {
    const data = await prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prepare(`${listQuery} WHERE p.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { client_id, name, details, start_date, status } = req.body;
  if (!client_id || !name?.trim() || !start_date) {
    return res.status(400).json({ error: 'Client, project name, and start date are required' });
  }

  try {
    const client = await prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
    if (!client) return res.status(400).json({ error: 'Invalid client' });

    const result = await prepare(
      `INSERT INTO projects (client_id, name, details, start_date, status, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(client_id, name.trim(), details || null, start_date, status || 'active');

    const newProject = await prepare(`${listQuery} WHERE p.id = ?`).get(result.lastInsertRowid);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { client_id, name, details, start_date, status } = req.body;
    if (!client_id || !name?.trim() || !start_date) {
      return res.status(400).json({ error: 'Client, project name, and start date are required' });
    }

    await prepare(
      `UPDATE projects SET client_id = ?, name = ?, details = ?, start_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(client_id, name.trim(), details || null, start_date, status || 'active', req.params.id);

    const updatedProject = await prepare(`${listQuery} WHERE p.id = ?`).get(req.params.id);
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
