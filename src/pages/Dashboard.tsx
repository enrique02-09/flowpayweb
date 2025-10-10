import { useEffect, useState } from 'react'
import PlaceholderChart from '../components/PlaceholderChart'
import Sidebar from '../components/Sidebar'
import StatsCard from '../components/StatsCard'
import { logout } from '../services/auth'
import { supabase } from '../services/supabase'
import Admins from './Admins'
import Billers from './Billers'
import Notifications from './Notifications'
import Reports from './Reports'
import SystemConfig from './SystemConfig'
import Users from './Users'

type Props = {
  onLogout: () => void
}

type Tx = {
  id: string
  created_at?: string
  user_id?: string
  type?: string
  amount?: number
  status?: string
  description?: string
}

const mockUsers = [
  { id: 1, name: 'Alice', account: '001234', email: 'alice@example.com', balance: 1240.5 },
  { id: 2, name: 'Bob', account: '001235', email: 'bob@example.com', balance: 540.0 },
]

export default function Dashboard({ onLogout }: Props) {
  const [section, setSection] = useState<string>('overview')
  const [loading, setLoading] = useState(false)

  // analytics state
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalTx, setTotalTx] = useState<number | null>(null)
  const [totalTransferred, setTotalTransferred] = useState<number | null>(null)
  const [monthlyVolume, setMonthlyVolume] = useState<Array<{ month: string; count: number; total: number }>>([])
  const [topUsers, setTopUsers] = useState<Array<{ user_id: string; name?: string; total: number }>>([])
  const [recentTx, setRecentTx] = useState<Tx[]>([])

  function handleLogout() {
    logout()
    onLogout()
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      // counts (supabase returns { data, error, count })
      const [usersRes, txRes] = await Promise.all([
        supabase.from('profile').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
      ])

      const usersCount = Number(usersRes.count ?? 0)
      const txCount = Number(txRes.count ?? 0)

      setTotalUsers(usersCount || 0)
      setTotalTx(txCount || 0)

      // recent transactions (last 50) - use range for pagination
      const { data: recent, error: recentErr } = await supabase
        .from('transactions')
        .select('id,created_at,amount,type,status,user_id,description')
        .order('created_at', { ascending: false })
        .range(0, 49)

      if (recentErr) throw recentErr
      const recentData = (recent || []) as Tx[]
      setRecentTx(recentData)

      // total transferred and monthly volume + top users (client-side aggregation)
      const since = new Date()
      since.setMonth(since.getMonth() - 12)

      const { data: txsForAgg, error: aggErr } = await supabase
        .from('transactions')
        .select('id,created_at,amount,user_id')
        .gte('created_at', since.toISOString())

      if (aggErr) throw aggErr

      const txs = (txsForAgg || []) as Array<{ created_at?: string; amount?: number; user_id?: string }>

      // total transferred
      const total = txs.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      setTotalTransferred(total)

      // monthly aggregation
      const monthsMap = new Map<string, { count: number; total: number }>()
      txs.forEach((r) => {
        if (!r.created_at) return
        const d = new Date(r.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const entry = monthsMap.get(key) || { count: 0, total: 0 }
        entry.count += 1
        entry.total += Number(r.amount) || 0
        monthsMap.set(key, entry)
      })

      const monthsArr = Array.from(monthsMap.entries())
        .map(([month, v]) => ({ month, count: v.count, total: v.total }))
        .sort((a, b) => a.month.localeCompare(b.month))

      setMonthlyVolume(monthsArr)

      // top users in last 6 months
      const since6 = new Date()
      since6.setMonth(since6.getMonth() - 6)
      const recentForTop = txs.filter((t) => {
        if (!t.created_at) return false
        return new Date(t.created_at) >= since6
      })

      const byUser = recentForTop.reduce((acc: Record<string, number>, t) => {
        if (!t.user_id) return acc
        acc[t.user_id] = (acc[t.user_id] || 0) + (Number(t.amount) || 0)
        return acc
      }, {})

      const userIds = Object.keys(byUser)
      let profilesMap: Record<string, string> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profile').select('id,fullname,email,username').in('id', userIds)
        ;(profiles || []).forEach((p: any) => {
          profilesMap[p.id] = p.fullname || p.email || p.username || p.id
        })
      }

      const top = Object.entries(byUser)
        .map(([user_id, total]) => ({ user_id, name: profilesMap[user_id], total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      setTopUsers(top)
    } catch (err) {
      // handle/log error as needed
      // console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-shell">
      <Sidebar active={section} onNavigate={setSection} />

      <main className="admin-main">
        <div className="admin-top">
          <h2>Admin Console</h2>
          <div className="top-actions">
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          </div>
        </div>

        {section === 'overview' && (
          <section className="section-overview">
            <div className="stats-grid">
              <StatsCard title="Total Users" value={loading ? '...' : (totalUsers ?? 0).toLocaleString()} />
              <StatsCard title="Total Transactions" value={loading ? '...' : (totalTx ?? 0).toLocaleString()} />
              <StatsCard title="Total Transferred" value={loading ? '...' : `$${(totalTransferred ?? 0).toLocaleString()}`} />
            </div>

            <div className="charts-grid">
              <PlaceholderChart title="Monthly Transaction Volume" />
              <div className="placeholder-chart">
                <div className="chart-title">Top Users</div>
                <div className="chart-body">
                  <ol>
                    {topUsers.length === 0 && <li>No data</li>}
                    {topUsers.map((u) => (
                      <li key={u.user_id}>{u.name || u.user_id} — ${u.total.toLocaleString()}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="recent">
              <h3>Recent Activities</h3>
              <ul>
                {recentTx.length === 0 && <li>No recent transactions</li>}
                {recentTx.map((t) => (
                  <li key={t.id}>
                    {t.created_at?.slice(0, 10)} — {t.user_id || '—'} — {t.type} — ${Number(t.amount || 0)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {section === 'users' && <Users />}

        {section === 'transactions' && (
          <section>
            <h3>Transactions</h3>
            <div className="tx-actions">
              <button className="btn">Export CSV</button>
              <button className="btn">Export PDF</button>
            </div>
            <table className="table">
              <thead>
                <tr><th>Date</th><th>User</th><th>Type</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentTx.map(t => (
                  <tr key={t.id}><td>{t.created_at?.slice(0,10)}</td><td>{t.user_id}</td><td>{t.type}</td><td>${Number(t.amount || 0)}</td><td>{t.status}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {section === 'billers' && <Billers />}

        {section === 'system' && <SystemConfig />}

        {section === 'notifications' && <Notifications />}

        {section === 'reports' && <Reports />}

        {section === 'admins' && <Admins />}
      </main>
    </div>
  )
}
