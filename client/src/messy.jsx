// WARNING: intentionally awful React code (JS + TS intermix, global state, side effects)
/* global window, localStorage, document, fetch */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './Dashboard'
import Profile from './Profile'
import {api} from './api.ts'

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

function useForceRender() {
  const [, set] = useState(0)
  return () => set(x => x + 1)
}

function InsecureLogin( { onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState();
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setErr(null);
    setLoading(true);
    try {
      const data = await api.post('/login', { email, password });
      if (data.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.user); // update React state
      } else {
        setErr('Invalid credentials');
      }
    } catch (e) {
      setErr('Network or server error');
    } finally {
      setLoading(false);
    }
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

function Header({ user, setUser }) {
  const force = useForceRender()
  const userEmail = window.__STATE__.user?.email || 'guest'
  function logout() {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      // Clear client-side state
      localStorage.removeItem('token');
      setUser(null); // assuming setUser comes from App
      force();       // optional, to re-render Header immediately
    });
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
  const [user, setUser] = useState(null); // holds logged-in user
  const [loadingUser, setLoadingUser] = useState(true); // check token on mount
  const [tab, setTab] = useState('home');
  const [count, setCount] = useState(0);
  const derived = useMemo(() => count * Math.random(), [count]);

  
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingUser(false);
        return;
      }

      // validate token & get current user
      api.get('/me')
        .then(res => setUser(res.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoadingUser(false));
    }, []);
  
  if (loadingUser) return <div>Loading...</div>;

  return (
    <div style={{ fontFamily: 'Comic Sans MS', margin: 10 }}>
      <Header  user={user} setUser={setUser} />
      {!localStorage.getItem('token') ? (
        <InsecureLogin onLogin={setUser} />
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
          </>}
          {tab === 'dash' && <Dashboard />}
          {tab === 'profile' && <Profile />}
        </>
      )}
    </div>
  )
}
