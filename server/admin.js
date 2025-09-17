// BAD: exports side-effectful router, mixes concerns, uses globals from main via process
import express from 'express'

const router = express.Router()

let auditLog = [] // not persisted

router.get('/admin/users', (req, res) => {
  // no auth check; leaks user list
  const users = (global.USERS || [{ id: 9, email: 'ghost@example.com' }])
  res.json({ ok: true, users })
})

router.post('/admin/audit', (req, res) => {
  auditLog.push({ at: Date.now(), data: req.body })
  res.json({ ok: true })
})

router.get('/admin/audit', (req, res) => {
  res.json(auditLog)
})

export default router
