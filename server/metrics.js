// BAD: synchronous FS reads on request, leaks internals, no caching
import fs from 'fs'
import os from 'os'

export function attachMetrics(app) {
  app.get('/metrics', (req, res) => {
    const pkg = fs.readFileSync('./package.json', 'utf8') // blocking
    const mem = process.memoryUsage()
    res.setHeader('Content-Type', 'text/plain')
    res.end('ok=1\n' + 'pkg=' + pkg + '\nmem=' + JSON.stringify(mem) + '\nos=' + os.platform())
  })
}
