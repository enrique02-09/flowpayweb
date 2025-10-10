import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

type Biller = {
  id: string
  user_id?: string
  bill_type?: string
  amount?: number
  due_date?: string
  status?: string
}

export default function Billers() {
  const [billers, setBillers] = useState<Biller[]>([])
  const [loading, setLoading] = useState(false)
  const [newBiller, setNewBiller] = useState({ bill_type: '', amount: '', due_date: '' })

  useEffect(() => {
    fetchBillers()
  }, [])

  async function fetchBillers() {
    setLoading(true)
    const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true }).limit(200)
    if (!error) setBillers(data || [])
    setLoading(false)
  }

  async function addBiller(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      bill_type: newBiller.bill_type,
      amount: Number(newBiller.amount || 0),
      due_date: newBiller.due_date || null,
      status: 'active',
    }
    const { error } = await supabase.from('bills').insert(payload)
    if (!error) {
      setNewBiller({ bill_type: '', amount: '', due_date: '' })
      fetchBillers()
    }
  }

  return (
    <div>
      <h3>Bill Payment Management</h3>
      <p>Manage billers and monitor payments.</p>

      <form onSubmit={addBiller} style={{ marginTop: 12 }}>
        <input placeholder="Biller name/type" value={newBiller.bill_type} onChange={(e) => setNewBiller(s => ({ ...s, bill_type: e.target.value }))} />
        <input placeholder="Amount" value={newBiller.amount} onChange={(e) => setNewBiller(s => ({ ...s, amount: e.target.value }))} />
        <input
          type="date"
          value={newBiller.due_date}
          onChange={(e) => setNewBiller(s => ({ ...s, due_date: e.target.value }))}
          placeholder="Due date"
          title="Due date"
        />
        <button type="submit">Add Biller</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <h4>Billers</h4>
        {loading && <div>Loading…</div>}
        {!loading && billers.length === 0 && <div>No billers</div>}
        <ul>
          {billers.map(b => (
            <li key={b.id}>
              {b.bill_type} — ${b.amount} — due {b.due_date} — {b.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}