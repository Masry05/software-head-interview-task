// BAD: odd API helper with mixed error handling, wrong base URL logic
export const api = {
  async get(path) {
    const url = (path.startsWith('http') ? path : 'http://localhost:4000' + path) // bypasses proxy
    const r = await fetch(url, { headers: { 'x-token': localStorage.getItem('token') || '' } })
    if (r.status == 204) return null
    try { return await r.json() } catch { return /** @type any */(r) }
  },
  async post(path, body) {
    const url = (path.startsWith('http') ? path : '/api' + path) // wrong proxy prefix
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-token': localStorage.getItem('token') || '' }, body: JSON.stringify(body) })
    return r.json().catch(() => ({}))
  }
}
