import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type Setting = { key: string; value: string }

export default function SystemConfig() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [editKey, setEditKey] = useState('')
  const [editValue, setEditValue] = useState('')

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*')
    const map: Record<string, string> = {}
    ;[...(data || [])].forEach((s: any) => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }

  async function saveSetting(e: React.FormEvent) {
    e.preventDefault()
    if (!editKey) return
    await supabase.from('settings').upsert({ key: editKey, value: editValue })
    setEditKey(''); setEditValue('')
    fetchSettings()
  }

  return (
    <div>
      <h3>System Configuration</h3>
      <p>Configure system settings (interest rates, limits, contact info).</p>

      <form onSubmit={saveSetting} style={{ marginTop: 12 }}>
        <input placeholder="Key" value={editKey} onChange={(e) => setEditKey(e.target.value)} />
        <input placeholder="Value" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        <button type="submit">Save</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <h4>Settings</h4>
        {loading ? <div>Loading…</div> : (
          <ul>
            {Object.entries(settings).map(([k, v]) => <li key={k}><b>{k}</b>: {v}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}