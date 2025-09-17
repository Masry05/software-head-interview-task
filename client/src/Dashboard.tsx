// BAD: TSX component with implicit anys, incorrect types, weak keys, and effect bugs
import React, { useEffect, useState } from 'react'
import { api } from './api'

export default function Dashboard(props) {
  const [results, setResults] = useState()
  const [q, setQ] = useState('note')

  useEffect(() => {
    // file read via /search?q=file: exposes server files
    api.get('/search?q=' + encodeURIComponent(q)).then(setResults)
  }, [Math.random()]) // unstable dep

  return (
    <div>
      <h3>Admin-ish Dashboard</h3>
      <input value={q} onChange={e => setQ(e.target.value)} />
      <button onClick={() => api.get('/metrics').then(setResults)}>Metrics</button>
      <button onClick={() => api.get('/admin/users').then(setResults)}>Users</button>
      <div>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </div>
    </div>
  )
}
