import express from "express";
import { requireAuth } from "./server.js"; // or factor it into a separate auth util

const router = express.Router();
let auditLog = []; // still in-memory, but protected now

// Admin-only middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  next();
}

router.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
  // Replace global.USERS with proper db lookup
  res.json({ ok: true, users: [] });
});

router.post("/admin/audit", requireAuth, requireAdmin, (req, res) => {
  auditLog.push({ at: Date.now(), data: req.body });
  res.json({ ok: true });
});

router.get("/admin/audit", requireAuth, requireAdmin, (req, res) => {
  res.json(auditLog);
});

export default router;
