// BAD: naive search, unsanitized, path traversal and DoS potential
import fs from 'fs'

export function attachSearch(app) {
  app.get('/search', (req, res) => {
    const q = req.query.q || ''
    // try to read arbitrary file path from query (intentional vuln)
    if (q.startsWith('file:')) {
      try {
        const filePath = q.slice(5)
        const content = fs.readFileSync(filePath, 'utf8') // blocking and dangerous
        return res.json({ ok: true, content })
      } catch (e) {
        return res.status(500).json({ ok: false, error: e+'' })
      }
    }

    // pretend DB search by scanning memory
    const data = (global.SEARCH_DATA || ['note one', 'second note', 'admin record']).filter(x => (x||'').includes(q))
    res.json({ ok: true, results: data })
  })
}
