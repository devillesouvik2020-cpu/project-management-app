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

  router.get('/', async (req, res) => {
    const search = req.query.search?.trim();
    let query = listQuery;
    const params = [];

    if (search) {
      query += ` WHERE p.name ILIKE ? OR c.name ILIKE ? OR t.description ILIKE ? OR CAST(t.amount AS TEXT) ILIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.id DESC';
    try {
      const data = await prepare(query).all(...params);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const row = await prepare(`${listQuery} WHERE t.id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.post('/', async (req, res) => {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const keys = Object.keys(req.body).filter((k) => k !== 'id');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => req.body[k]);

    try {
      const result = await prepare(
        `INSERT INTO ${table} (${keys.join(', ')}, updated_at) VALUES (${placeholders}, CURRENT_TIMESTAMP)`
      ).run(...values);

      const newItem = await prepare(`${listQuery} WHERE t.id = ?`).get(result.lastInsertRowid);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const existing = await prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const keys = Object.keys(req.body).filter((k) => !['id', 'created_at', 'project_name', 'client_name'].includes(k));
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = keys.map((k) => req.body[k]);

      await prepare(`UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
        ...values,
        req.params.id
      );

      const updatedItem = await prepare(`${listQuery} WHERE t.id = ?`).get(req.params.id);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
      if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

module.exports = { createLinkedCrudRoute };
