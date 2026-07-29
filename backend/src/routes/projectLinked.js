const express = require('express');
const { prepare } = require('../database');
const { authMiddleware } = require('../middleware/auth');

function createLinkedCrudRoute(table, requiredFields) {
  const router = express.Router();
  router.use(authMiddleware);

  const listQuery = `
    SELECT t.*, p.name AS project_name, c.name AS client_name
    FROM ${table} t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN clients c ON c.id = p.client_id
  `;

  router.get('/', (req, res) => {
    const search = req.query.search?.trim();
    let query = listQuery;
    const params = [];

    if (search) {
      query += ` WHERE p.name LIKE ? OR c.name LIKE ? OR t.description LIKE ? OR CAST(t.amount AS TEXT) LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.id DESC';
    res.json(prepare(query).all(...params));
  });

  router.get('/:id', (req, res) => {
    const row = prepare(`${listQuery} WHERE t.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', (req, res) => {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const keys = Object.keys(req.body).filter((k) => k !== 'id');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => req.body[k]);

    const result = prepare(
      `INSERT INTO ${table} (${keys.join(', ')}, updated_at) VALUES (${placeholders}, datetime('now'))`
    ).run(...values);

    res.status(201).json(prepare(`${listQuery} WHERE t.id = ?`).get(result.lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const existing = prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const keys = Object.keys(req.body).filter((k) => !['id', 'created_at', 'project_name', 'client_name'].includes(k));
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => req.body[k]);

    prepare(`UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values,
      req.params.id
    );

    res.json(prepare(`${listQuery} WHERE t.id = ?`).get(req.params.id));
  });

  router.delete('/:id', (req, res) => {
    const result = prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });

  return router;
}

module.exports = { createLinkedCrudRoute };
