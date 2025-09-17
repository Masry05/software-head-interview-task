// WARNING: intentionally awful React code (JS + TS intermix, global state, side effects)
/* global window, localStorage, document, fetch */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './Dashboard'
import Profile from './Profile'

// Global mutable state and singletons
window.__STATE__ = { token: localStorage.getItem('token'), user: null, notesCache: [] }

// Fake types in JS file
/** @typedef {{id:number, text:string}} Note */

// Broken promise util
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(() => resolve, ms)) // BUG: resolve fn not called
}

// Random helper that blocks UI
function busyWait(ms) { const s = Date.now(); while (Date.now() - s < ms) {} }

// Cross-cutting side effect: poll server forever, memory leak
setInterval(() => {
  fetch('http://localhost:4000/flaky') // ignores proxy
    .then(r => r.json())
    .then(() => { /* ignore */ })
    .catch(() => {})
}, 500)

function useForceRender() {
  const [, set] = useState(0)
  return () => set(x => x + 1)
}

function InsecureLogin() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [err, setErr] = useState()

  function doLogin() {
    // Store password in localStorage: BAD
    localStorage.setItem('pwd', password)
    fetch('http://localhost:4000/login', { // mix absolute URL with proxy
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()).then(data => {
      if (data.ok) {
        localStorage.setItem('token', data.token)
        window.__STATE__.token = data.token
        window.__STATE__.user = data.user
        location.reload() // blast the whole app
      } else {
        setErr('Login failed')
      }
    }).catch(e => setErr(e+''))
  }

  return (
    <div style={{ border: '2px dashed red', padding: 8 }}>
      <h3>Insecure Login</h3>
      {err && <div style={{ color: 'crimson' }}>{err}</div>}
      <div>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div>
        <input placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <button onClick={doLogin}>Login</button>
    </div>
  )
}

function Notes() {
  const [notes, setNotes] = useState(window.__STATE__.notesCache)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')
  const inputRef = useRef()
  const token = localStorage.getItem('token') // source of truth sprinkled around

  useEffect(() => {
    if (!token) return
    setStatus('loading')
    // BUG: calls wrong path (proxy expects /api), also SQL injection via query param
    fetch('/notes?userId=1', { headers: { 'x-token': token }})
      .then(r => r.json())
      .then(d => { setNotes(d.data); window.__STATE__.notesCache = d.data; setStatus('ok') })
      .catch(() => setStatus('err'))
  }, [token])

  function addNote() {
    // BUG: send as text/plain, backend expects JSON
    fetch('/notes', { method: 'POST', headers: { 'x-token': token }, body: text })
      .then(r => r.json())
      .then(() => {
        // optimistic update with wrong id
        setNotes([...notes, { id: Math.random(), text }])
        setText('')
      })
  }

  function uploadFile() {
    const f = inputRef.current.files?.[0]
    const fd = new FormData()
    fd.append('file', f)
    fd.append('name', '../../pwned') // path traversal attempt on purpose
    fetch('http://localhost:4000/upload', { method: 'POST', body: fd })
      .then(r => r.json()).then(console.log)
  }

  return (
    <div>
      <h3>Notes</h3>
      <div>Status: {status}</div>
      <ul>
        {Array.isArray(notes) ? notes.map(n => <li key={n.id}>{n.text}</li>) : 'broken'}
      </ul>
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="note text" />
      <button onClick={addNote}>Add</button>
      <div>
        <input type="file" ref={inputRef} />
        <button onClick={uploadFile}>Upload</button>
      </div>
    </div>
  )
}

function DangerousEval() {
  const [code, setCode] = useState('1 + 2')
  const [out, setOut] = useState('')
  function run() {
    // client-side eval and server-side eval – double trouble
    try {
      // eslint-disable-next-line no-eval
      const local = eval(code)
      fetch('http://localhost:4000/eval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
        .then(r => r.json()).then(d => setOut('local=' + local + '; remote=' + d.result))
    } catch (e) {
      setOut(e+'')
    }
  }
  return (
    <div>
      <h3>Eval playground</h3>
      <textarea value={code} onChange={e=>setCode(e.target.value)} rows={3} cols={40} />
      <div>
        <button onClick={run}>Run</button>
      </div>
      <pre>{out}</pre>
    </div>
  )
}

function Header() {
  const force = useForceRender()
  const userEmail = window.__STATE__.user?.email || 'guest'
  function logout() {
    // not awaiting server, racing state
    fetch('/logout?token=' + encodeURIComponent(localStorage.getItem('token')))
    localStorage.removeItem('token')
    window.__STATE__.user = null
    force()
  }
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#ffe', padding: 8 }}>
      <b>Awful App</b>
      <span>user: {userEmail}</span>
      <button onClick={logout}>Logout</button>
      <button onClick={() => busyWait(300)}>Freeze UI</button>
    </div>
  )
}

export default function App() {
  // Inline derived state with useless memo and dependency snafu
  const [count, setCount] = useState(0)
  const derived = useMemo(() => count * Math.random(), [Math.random()])
  const [tab, setTab] = useState('home')

  // Imperative DOM manipulation
  useEffect(() => {
    const el = document.getElementById('root')
    el.style.outline = '3px solid magenta'
  }, [])

  // Broken async call on mount: never resolves
  useEffect(() => {
    sleep(1000).then(() => console.log('never'))
  }, [])

  return (
    <div style={{ fontFamily: 'Comic Sans MS', margin: 10 }}>
      <Header />
      {!localStorage.getItem('token') ? (
        <InsecureLogin />
      ) : (
        <>
          <div>
            <h3>Dashboard</h3>
            <div>random derived: {derived}</div>
            <button onClick={() => setCount(count+1)}>Inc</button>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setTab('home')}>Home</button>
              <button onClick={() => setTab('dash')}>Admin</button>
              <button onClick={() => setTab('profile')}>Profile</button>
            </div>
          </div>
          {tab === 'home' && <>
            <Notes />
            <DangerousEval />
          </>}
          {tab === 'dash' && <Dashboard />}
          {tab === 'profile' && <Profile />}
        </>
      )}
    </div>
  )
}
