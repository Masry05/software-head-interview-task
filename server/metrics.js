import { requireAuth } from "./server.js"; // or wherever you defined it

export function attachMetrics(app) {
  app.get("/metrics", requireAuth, (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const mem = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      ok: true,
      uptime,
      memory: mem,
      os: os.platform(),
      pkg: {
        name: cachedPkg.name,
        version: cachedPkg.version,
      },
    });
  });
}
