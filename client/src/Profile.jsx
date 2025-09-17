// BAD: Component with uncontrolled side effects and mixed responsibilities
import React, { useEffect, useState } from 'react'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch('/me?token=' + localStorage.getItem('token')) // leaks token in URL
      .then(r => r.json())
      .then(setMe)
      .catch(e => setErr(e+''))
  }, [])

  function breakThings() {
    // force a synchronous layout thrash
    for (let i=0;i<20000;i++) document.body.offsetHeight
    // scribble over global state
    window.__STATE__ = { hacked: true }
  }

  return (
    <div>
      <h3>Profile</h3>
      <button onClick={breakThings}>Break Things</button>
      <pre>{JSON.stringify({ me, err }, null, 2)}</pre>
    </div>
  )
}
