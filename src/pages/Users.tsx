import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

type Profile = {
  id: string
  fullname?: string
  account_number?: string
  email?: string
  balance?: number
  is_admin?: boolean
  is_active?: boolean
}

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState<string>('')
  const [editActive, setEditActive] = useState<boolean>(true)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 10

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('profile')
        .select('id,fullname,account_number,email,balance,is_admin,is_active', { count: 'exact' })
        .order('fullname', { ascending: true })
        .range(from, to)

      if (search && search.trim()) {
        const q = `%${search.trim()}%`
        query = supabase
          .from('profile')
          .select('id,fullname,account_number,email,balance,is_admin,is_active', { count: 'exact' })
          .or(`fullname.ilike.${q},email.ilike.${q},account_number.ilike.${q}`)
          .order('fullname', { ascending: true })
          .range(from, to)
      }

      const { data, error: err, count } = await query
      if (err) throw err
      setUsers((data || []) as Profile[])
      setTotal(Number(count ?? 0))
    } catch (e: any) {
      setError(e?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(u: Profile) {
    const confirmMsg = u.is_active ? 'Suspend this user?' : 'Activate this user?'
    if (!window.confirm(confirmMsg)) return
    setLoading(true)
    try {
      const { error } = await supabase.from('profile').update({ is_active: !u.is_active }).eq('id', u.id)
      if (error) throw error
      fetchUsers()
    } catch (e: any) {
      setError(e?.message || 'Failed to update user')
      setLoading(false)
    }
  }

  async function exportCSV() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id,fullname,account_number,email,balance,is_admin,is_active')
        .order('fullname', { ascending: true })
        .limit(10000)

      if (error) throw error
      const rows = (data || []) as any[]
      const headers = ['id', 'fullname', 'account_number', 'email', 'balance', 'is_admin', 'is_active']
      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const cell = r[h] ?? ''
              const escaped = String(cell).replace(/"/g, '""')
              return `"${escaped}"`
            })
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  function closeEdit() {
    setEditUser(null)
    setEditName('')
    setEditBalance('')
    setEditActive(true)
    setEditError(null)
    setEditLoading(false)
  }

  async function saveEdit() {
    if (!editUser) return
    setEditLoading(true)
    setEditError(null)
    try {
      const payload: any = {
        fullname: editName,
        balance: Number(editBalance) || 0,
        is_active: editActive,
      }
      const { error } = await supabase.from('profile').update(payload).eq('id', editUser.id)
      if (error) throw error
      await fetchUsers()
      closeEdit()
    } catch (e: any) {
      setEditError(e?.message || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">User Management</h3>
          <p className="text-gray-500 mt-1">Total users: <strong>{total.toLocaleString()}</strong></p>
        </div>
        <button
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:shadow-lg transition-shadow duration-200 disabled:opacity-50"
          onClick={exportCSV}
          disabled={loading || total === 0}
        >
          📥 Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search by name, email or account number..."
          value={search}
          onChange={(e) => {
            setPage(0)
            setSearch(e.target.value)
          }}
        />
        <button
          className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          onClick={() => fetchUsers()}
          disabled={loading}
        >
          🔍 Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">⏳</div>
          Loading…
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Account</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{u.fullname || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-mono">{u.account_number || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{u.email || '—'}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                      ${Number(u.balance ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.is_active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          onClick={() => toggleActive(u)}
                        >
                          {u.is_active !== false ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          onClick={() => {
                            setEditUser(u)
                            setEditName(u.fullname || '')
                            setEditBalance(String(u.balance ?? 0))
                            setEditActive(u.is_active !== false)
                            setEditError(null)
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-600">
              {total > 0 ? (
                (() => {
                  const start = page * PAGE_SIZE
                  const end = Math.min(start + users.length, total)
                  return <span>{`${start + 1}–${end} of ${total.toLocaleString()}`}</span>
                })()
              ) : (
                <span>0 of 0</span>
              )}
            </span>
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg z-10">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">Edit User</h4>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeEdit}>✕</button>
            </div>
            {editError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mt-3">{editError}</div>}
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-gray-700">Name
                <input
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>

              <label className="block text-sm text-gray-700">Balance
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="w-4 h-4" />
                Active
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={closeEdit} disabled={editLoading}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60" onClick={saveEdit} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
