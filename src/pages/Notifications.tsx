import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import Icon from '../components/Icons'

export default function Notifications() {
  const [items, setItems] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setItems(data || [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim()) return
    await supabase.from('notifications').insert({ message: msg.trim() })
    setMsg('')
    fetchItems()
  }

  async function markRead(id: string) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)))
    } catch (e) {
      // ignore
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this notification?')) return
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      // ignore
    }
  }

  const shown = items.filter((i) => (filter === 'unread' ? !i.read : true))

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Notifications</h3>
          <p className="text-gray-500 mt-1">Send announcements and manage platform notifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700">Total: <strong>{items.length}</strong></div>
          <button className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl" onClick={fetchItems}><Icon name="refresh" className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <form onSubmit={send} className="md:col-span-2 flex gap-3">
          <input
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write announcement to broadcast to all users..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <button className="px-5 py-3 bg-green-600 text-white rounded-xl" type="submit">Send</button>
        </form>

        <div className="flex items-center gap-2">
          <button className={`px-3 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`px-3 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700'}`} onClick={() => setFilter('unread')}>Unread</button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-3">
            {shown.length === 0 && <div className="text-gray-500 p-6">No notifications</div>}
            {shown.map((n) => (
              <div key={n.id} className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${n.read ? 'border-gray-100 bg-white' : 'border-blue-100 bg-blue-50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${n.read ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'}`}>
                      <Icon name="bell" className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{n.title || 'Announcement'}</div>
                      <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700">{n.message}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {!n.read && (
                    <button className="text-sm text-blue-600" onClick={() => markRead(n.id)}>Mark read</button>
                  )}
                  <button className="text-sm text-red-600" onClick={() => remove(n.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}