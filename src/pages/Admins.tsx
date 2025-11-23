import { useEffect, useState } from 'react'
import { saveAs } from 'file-saver'
import { supabase } from '../services/supabase'
import Icon from '../components/Icons'

type Profile = { id: string; fullname?: string; email?: string; is_admin?: boolean; role?: string }

export default function Admins() {
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const [total, setTotal] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Profile> | null>(null)

  useEffect(() => { fetchAdmins(page) }, [page])

  async function fetchAdmins(pageIndex = 0) {
    setLoading(true)
    try {
      const from = pageIndex * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q: any = supabase
        .from('profile')
        .select('id,fullname,email,is_admin,role', { count: 'exact' })
        .order('fullname', { ascending: true })

      // only admins or roles that imply admin
      q = q.or('is_admin.eq.true,role.eq.admin')

      if (query) {
        q = q.ilike('fullname', `%${query}%`).or(`email.ilike.%${query}%`)
      }

      const { data, error, count } = await q.range(from, to)
      if (error) throw error
      setAdmins((data || []) as Profile[])
      setTotal(Number(count ?? 0))
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  async function exportCSV() {
    setLoading(true)
    try {
      let q: any = supabase.from('profile').select('id,fullname,email,is_admin,role').or('is_admin.eq.true,role.eq.admin').order('fullname')
      if (query) q = q.ilike('fullname', `%${query}%`)
      const { data, error } = await q.limit(20000)
      if (error) throw error

      const rows = (data || []) as any[]
      const headers = ['id','fullname','email','is_admin','role']
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
        const v = r[h] == null ? '' : String(r[h]).replace(/"/g, '""')
        return `"${v}"`
      }).join(','))).join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `admin_accounts_${new Date().toISOString().slice(0,10)}.csv`)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  function openNew() { setEditing({ is_admin: true, role: 'admin' }); setModalOpen(true) }
  function openEdit(p: Profile) { setEditing({ ...p }); setModalOpen(true) }

  async function saveAdmin() {
    if (!editing) return
    setLoading(true)
    try {
      const payload: any = { fullname: editing.fullname, email: editing.email, role: editing.role, is_admin: !!editing.is_admin }
      if (editing && editing.id) {
        const { error } = await supabase.from('profile').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        // create a profile record - note: does not create auth user
        const { error } = await supabase.from('profile').insert(payload)
        if (error) throw error
      }
      setModalOpen(false)
      setEditing(null)
      fetchAdmins(page)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  async function toggleAdmin(p: Profile) {
    setLoading(true)
    try {
      const { error } = await supabase.from('profile').update({ is_admin: !p.is_admin }).eq('id', p.id)
      if (error) throw error
      fetchAdmins(page)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function removeAdmin(p: Profile) {
    if (!confirm(`Delete admin profile for ${p.fullname || p.email}? This cannot be undone.`)) return
    setLoading(true)
    try {
      const { error } = await supabase.from('profile').delete().eq('id', p.id)
      if (error) throw error
      fetchAdmins(page)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Admin Accounts</h3>
          <p className="text-gray-500 mt-1">Manage administrative users, roles and permissions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl" onClick={exportCSV} disabled={loading}>
            <Icon name="download" className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl" onClick={openNew}>
            <Icon name="user" className="w-4 h-4" />
            <span>New Admin</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 w-full max-w-md">
          <Icon name="search" className="w-5 h-5 text-gray-400" />
          <input placeholder="Search name or email" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
          <button className="px-3 py-2 bg-gray-100 rounded-lg" onClick={() => fetchAdmins(0)}>Search</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b-2 border-gray-100">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center">Loading…</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No admin accounts found.</td></tr>
              ) : (
                admins.map(a => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{a.fullname || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{a.email || '—'}</td>
                    <td className="py-3 px-4 text-sm">{a.role || 'admin'}</td>
                    <td className="py-3 px-4 text-sm">{a.is_admin ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg" onClick={() => openEdit(a)} title="Edit">
                          <Icon name="user" className="w-4 h-4" />
                        </button>
                        <button className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg" onClick={() => toggleAdmin(a)} title={a.is_admin ? 'Revoke admin' : 'Make admin'}>
                          <Icon name="swap" className="w-4 h-4" />
                        </button>
                        <button className="px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg" onClick={() => removeAdmin(a)} title="Delete">
                          <Icon name="close" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page+1)*PAGE_SIZE, total)} of ${total}` : '0 of 0'}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-gray-100 rounded-lg" onClick={() => { setPage((p) => Math.max(0, p-1)); fetchAdmins(Math.max(0, page-1)) }} disabled={page === 0}>← Prev</button>
            <button className="px-3 py-2 bg-gray-100 rounded-lg" onClick={() => { setPage((p) => p+1); fetchAdmins(page+1) }} disabled={(page+1)*PAGE_SIZE >= total}>Next →</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">{editing && editing.id ? 'Edit Admin' : 'New Admin'}</h4>
              <button className="p-2" onClick={() => { setModalOpen(false); setEditing(null) }}><Icon name="close" className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs text-gray-600">Full name</label>
              <input className="px-3 py-2 border border-gray-200 rounded-lg" value={editing?.fullname || ''} onChange={(e) => setEditing((s) => ({ ...(s||{}), fullname: e.target.value }))} />

              <label className="text-xs text-gray-600">Email</label>
              <input className="px-3 py-2 border border-gray-200 rounded-lg" value={editing?.email || ''} onChange={(e) => setEditing((s) => ({ ...(s||{}), email: e.target.value }))} />

              <label className="text-xs text-gray-600">Role</label>
              <select className="px-3 py-2 border border-gray-200 rounded-lg" value={editing?.role || 'admin'} onChange={(e) => setEditing((s) => ({ ...(s||{}), role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="super">Super Admin</option>
                <option value="editor">Editor</option>
              </select>

              <label className="inline-flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={!!editing?.is_admin} onChange={(e) => setEditing((s) => ({ ...(s||{}), is_admin: e.target.checked }))} />
                <span>Is Admin</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-100 rounded-lg" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={saveAdmin} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}