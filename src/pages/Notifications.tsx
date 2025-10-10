import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export default function Notifications() {
  const [items, setItems] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    setItems(data || [])
    setLoading(false)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!msg) return
    await supabase.from('notifications').insert({ message: msg })
    setMsg('')
    fetch()
  }

  return (
    <div>
      <h3>Notifications</h3>
      <p>Send announcements and view logs.</p>

      <form onSubmit={send} style={{ marginTop: 12 }}>
        <input placeholder="Message" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button type="submit">Send</button>
      </form>

      <div style={{ marginTop: 16 }}>
        {loading ? <div>Loading…</div> : (
          <ul>
            {items.map(n => <li key={n.id}>{n.created_at?.slice(0,19)} — {n.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}