export function attachSearch(app, db) {
  app.get('/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();

      if (!q) return res.json({ ok: true, results: [] });
      if (q.length > 200) return res.status(400).json({ ok: false, error: 'query too long' });
      
      const searchParam = `%${q}%`;

      const LIMIT = 50;

      db.all(
        'SELECT id, userId, text FROM notes WHERE text LIKE ? LIMIT ?',
        [searchParam, LIMIT],
        (err, rows) => {
          if (err) {
            console.error('Search DB error:', err);
            return res.status(500).json({ ok: false, error: 'search failed' });
          }
          const results = (rows || []).map(r => ({ id: r.id, userId: r.userId, snippet: (r.text || '').slice(0, 200) }));
          res.json({ ok: true, results });
        }
      );
    } catch (e) {
      console.error('Search handler error:', e);
      res.status(500).json({ ok: false, error: 'internal error' });
    }
  });
  app.get("/search/:id", (req, res) => {
    const noteId = req.params.id;

    db.get(
      "SELECT id, userId, text FROM notes WHERE id = ?",
      [noteId],
      (err, row) => {
        if (err) return res.status(500).json({ ok: false, error: "db error" });
        if (!row) return res.status(404).json({ ok: false, error: "note not found" });

        res.json({ ok: true, note: row });
      }
    );
  });
}
