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
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 20

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

  async function toggleAdmin(u: Profile) {
    const confirmMsg = u.is_admin ? 'Revoke admin from this user?' : 'Make this user admin?'
    if (!window.confirm(confirmMsg)) return
    setLoading(true)
    try {
      const { error } = await supabase.from('profile').update({ is_admin: !u.is_admin }).eq('id', u.id)
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

  return (
    <div className="page-card users-page">
      <header className="page-header">
        <h3>User Management</h3>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV} disabled={loading || total === 0}>
            Export CSV
          </button>
        </div>
      </header>

      <div className="controls">
        <input
          className="input"
          placeholder="Search by name, email or account"
          value={search}
          onChange={(e) => {
            setPage(0)
            setSearch(e.target.value)
          }}
        />
        <button className="btn" onClick={() => fetchUsers()} disabled={loading}>
          Search
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          <div className="meta">
            Total users: <strong>{total.toLocaleString()}</strong>
          </div>

          <div className="table-wrap">
            <table className="table modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Admin</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullname}</td>
                    <td>{u.account_number}</td>
                    <td>{u.email}</td>
                    <td>${Number(u.balance ?? 0).toLocaleString()}</td>
                    <td>{String(Boolean(u.is_admin))}</td>
                    <td>{String(u.is_active ?? true)}</td>
                    <td>
                      <button className="btn btn-ghost" onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                      <button className="btn" onClick={() => toggleAdmin(u)} style={{ marginLeft: 8 }}>
                        {u.is_admin ? 'Revoke' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Prev
            </button>
            <span className="pager-info">
              Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
