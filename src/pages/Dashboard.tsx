import { useEffect, useState } from 'react'
import PlaceholderChart from '../components/PlaceholderChart'
import DonutChart from '../components/DonutChart'
import Sidebar from '../components/Sidebar'
import StatsCard from '../components/StatsCard'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icons'
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

export default function Dashboard({ onLogout }: Props) {
  const [section, setSection] = useState<string>('overview')
  const [loading, setLoading] = useState(false)

  // analytics state
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalTx, setTotalTx] = useState<number | null>(null)
  const [totalTransferred, setTotalTransferred] = useState<number | null>(null)
  const [_monthlyVolume, setMonthlyVolume] = useState<Array<{ month: string; count: number; total: number }>>([])
  const [overviewRange, setOverviewRange] = useState<number>(6) // months (default 6)
  const [topUsers, setTopUsers] = useState<Array<{ user_id: string; name?: string; total: number }>>([])
  const [recentTx, setRecentTx] = useState<Tx[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({})
  // transactions paging/search state
  const [txPage, setTxPage] = useState(0)
  const [txSearch, setTxSearch] = useState('')
  const [txTotal, setTxTotal] = useState(0)
  const [transactionsList, setTransactionsList] = useState<Tx[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const TX_PAGE_SIZE = 10
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null)
  const [selectedTxDetails, setSelectedTxDetails] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  function handleLogout() {
    logout()
    onLogout()
  }

  useEffect(() => {
    fetchAnalytics()
    // fetch first page of transactions for the transactions view
    fetchPagedTransactions(0, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (section === 'transactions') fetchPagedTransactions(txPage, txSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, txPage, txSearch])

  async function fetchPagedTransactions(page: number, searchTerm: string) {
    setTxLoading(true)
    try {
      const from = page * TX_PAGE_SIZE
      const to = from + TX_PAGE_SIZE - 1

      const q = searchTerm?.trim() || ''

      // if there's a search, try to find matching profiles first
      let profileIds: string[] = []
      if (q) {
        const pat = `%${q}%`
        const { data: profiles } = await supabase
          .from('profile')
          .select('id')
          .or(`account_number.ilike.${pat},fullname.ilike.${pat},email.ilike.${pat},username.ilike.${pat}`)
          .limit(200)
        profileIds = (profiles || []).map((p: any) => p.id)
      }

      // build OR clause: description.ilike, type.ilike and user_id.eq.<id> for each matching profile id
      let query: any = supabase
        .from('transactions')
        .select('id,created_at,amount,type,status,user_id,description', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (q) {
        const pat = `%${q}%`
        const orParts = [`description.ilike.${pat}`, `type.ilike.${pat}`]
        profileIds.forEach((id) => orParts.push(`user_id.eq.${id}`))
        const orClause = orParts.join(',')
        query = query.or(orClause).range(from, to)
      } else {
        query = query.range(from, to)
      }

      const { data: txData, error: txErr, count } = await query
      if (txErr) throw txErr

      const txs = (txData || []) as Tx[]
      setTransactionsList(txs)
      setTxTotal(Number(count ?? 0))

      // fetch profiles for the returned txs so we can show account numbers
      try {
        const idsSet = new Set<string>()
        txs.forEach((t) => t.user_id && idsSet.add(t.user_id))
        const ids = Array.from(idsSet)
        if (ids.length) {
          const { data: profilesForTx } = await supabase
            .from('profile')
            .select('id,account_number,fullname,email,username')
            .in('id', ids)

          const lookup: Record<string, string> = {}
          ;(profilesForTx || []).forEach((p: any) => {
            lookup[p.id] = p.account_number || p.fullname || p.email || p.username || p.id
          })
          setProfilesMap((prev) => ({ ...prev, ...lookup }))
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore for now
    } finally {
      setTxLoading(false)
    }
  }

  // Export CSV for transactions (exports all matching records, not just current page)
  async function exportTransactionsCSV() {
    try {
      setTxLoading(true)
      const q = txSearch?.trim() || ''

      // if there's a search, try to find matching profiles first
      let profileIds: string[] = []
      if (q) {
        const pat = `%${q}%`
        const { data: profiles } = await supabase
          .from('profile')
          .select('id')
          .or(`account_number.ilike.${pat},fullname.ilike.${pat},email.ilike.${pat},username.ilike.${pat}`)
          .limit(200)
        profileIds = (profiles || []).map((p: any) => p.id)
      }

      // build query similar to fetchPagedTransactions but without range
      let query: any = supabase
        .from('transactions')
        .select('id,created_at,amount,type,status,user_id,description')
        .order('created_at', { ascending: false })

      if (q) {
        const pat = `%${q}%`
        const orParts = [`description.ilike.${pat}`, `type.ilike.${pat}`]
        profileIds.forEach((id) => orParts.push(`user_id.eq.${id}`))
        const orClause = orParts.join(',')
        query = query.or(orClause)
      }

      const { data: allTx, error } = await query
      if (error) throw error

      const rows = (allTx || []) as Tx[]

      if (!rows.length) {
        // nothing to export
        alert('No transactions to export')
        return
      }

      // build CSV
      const header = ['Date', 'User', 'Type', 'Amount', 'Status', 'Description', 'ID']
      const csvRows = [header.join(',')]

      // map profiles for user labels (use existing profilesMap when possible)
      const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
      let lookup: Record<string, string> = { ...(profilesMap || {}) }
      if (ids.length) {
        try {
          const { data: profiles } = await supabase
            .from('profile')
            .select('id,account_number,fullname,email,username')
            .in('id', ids)
          ;(profiles || []).forEach((p: any) => {
            lookup[p.id] = p.account_number || p.fullname || p.email || p.username || p.id
          })
        } catch (e) {
          // ignore
        }
      }

      rows.forEach((r) => {
        const date = r.created_at ? new Date(r.created_at).toLocaleString() : ''
        const userLabel = (r.user_id && lookup[r.user_id]) || r.user_id || ''
        const type = r.type || ''
        const amount = typeof r.amount === 'number' ? r.amount.toString() : (r.amount || '')
        const status = r.status || ''
        const desc = (r.description || '').replace(/\n/g, ' ').replace(/"/g, '""')
        const id = r.id || ''
        const row = [date, `"${userLabel}"`, type, amount, status, `"${desc}"`, id]
        csvRows.push(row.join(','))
      })

      const csv = csvRows.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Export failed')
    } finally {
      setTxLoading(false)
    }
  }

  async function fetchTxDetails(id: string) {
    setDetailLoading(true)
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single()
      if (error) {
        setSelectedTxDetails(null)
      } else {
        setSelectedTxDetails(data)
      }
    } catch (e) {
      setSelectedTxDetails(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function openTxDetails(tx: Tx) {
    setSelectedTx(tx)
    if (tx?.id) await fetchTxDetails(tx.id)
  }

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

      // fetch profile account numbers for transactions/users displayed
      try {
        const idsSet = new Set<string>()
        recentData.forEach((r) => r.user_id && idsSet.add(r.user_id))
        txs.forEach((r: any) => r.user_id && idsSet.add(r.user_id))
        const ids = Array.from(idsSet)
        if (ids.length) {
          const { data: profilesForTx } = await supabase
            .from('profile')
            .select('id,account_number,fullname,email,username')
            .in('id', ids)

          const lookup: Record<string, string> = {}
          ;(profilesForTx || []).forEach((p: any) => {
            lookup[p.id] = p.account_number || p.fullname || p.email || p.username || p.id
          })
          setProfilesMap(lookup)
        }
      } catch (e) {
        // ignore profile lookup errors
      }

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

  // quick actions removed (transfer / pay bills buttons were removed)

  return (
    <div className="flex gap-6 w-screen min-h-screen bg-gray-50">
      <Sidebar active={section} onNavigate={setSection} />

      <main className="flex-1 max-w-full relative">
        {/* Mobile-style header/banner (mirrors mobile app look) */}
        <div className="mobile-banner rounded-2xl shadow-lg p-6 mb-6 overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
                <h2 className="text-sm font-semibold opacity-90">Balance</h2>
                <div className="mt-2 balance-value text-4xl md:text-5xl font-extrabold">{loading ? '...' : `₱${(totalTransferred ?? 0).toLocaleString()}`}</div>
              </div>

            <div className="flex items-start gap-3">
              <div className="profile-badge">ES</div>
              <button
                onClick={handleLogout}
                className="logout-ghost hidden md:inline-block px-4 py-2 bg-white/20 text-white font-medium rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* action buttons removed per request */}
        </div>

        {section === 'overview' && (
          <section>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCard
                title="Total Users"
                value={loading ? '...' : (totalUsers ?? 0).toLocaleString()}
                icon="user"
                color="blue"
              />
              <StatsCard
                title="Total Transactions"
                value={loading ? '...' : (totalTx ?? 0).toLocaleString()}
                icon="chartLine"
                color="green"
              />
              <StatsCard
                title="Total Transferred"
                value={loading ? '...' : `$${(totalTransferred ?? 0).toLocaleString()}`}
                icon="creditCard"
                color="purple"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Monthly Transaction Volume</h3>
                  <div className="flex items-center gap-2">
                    <button
                      className={`px-3 py-1 rounded-lg text-sm ${overviewRange === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => setOverviewRange(1)}
                    >1M</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm ${overviewRange === 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => setOverviewRange(3)}
                    >3M</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm ${overviewRange === 6 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => setOverviewRange(6)}
                    >6M</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm ${overviewRange === 12 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => setOverviewRange(12)}
                    >12M</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm ${overviewRange === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => setOverviewRange(0)}
                      title="All"
                    >All</button>
                  </div>
                </div>

                {/* build chart data from monthlyVolume */}
                {
                  (() => {
                    const months = _monthlyVolume.slice().sort((a, b) => a.month.localeCompare(b.month))
                    let filtered = months
                    if (overviewRange > 0) {
                      filtered = months.slice(-overviewRange)
                    }
                    const chartData = filtered.map((m) => {
                      const parts = m.month.split('-')
                      const y = parts[0]
                      const mo = Number(parts[1])
                      const label = new Date(Number(y), mo - 1, 1).toLocaleString(undefined, { month: 'short' })
                      return { label, value: Math.round(m.total || m.count || 0) }
                    })

                    return <PlaceholderChart title="" data={chartData} type="bar" height={220} />
                  })()
                }
              </div>

              <div className="space-y-4">
                <DonutChart
                  title="Transaction Type Distribution"
                  data={(() => {
                    if (!recentTx || recentTx.length === 0) return []
                    const map: Record<string, number> = {}
                    recentTx.forEach((t) => {
                      const key = (t.type || 'unknown').toString()
                      map[key] = (map[key] || 0) + 1
                    })
                    const arr = Object.entries(map).map(([label, value]) => ({ label, value, color: undefined }))
                    return arr.sort((a, b) => b.value - a.value).slice(0, 6)
                  })()}
                />

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Users</h3>
                  <div className="space-y-3">
                    {topUsers.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No data available</p>
                    )}
                    {topUsers.slice(0, 5).map((u) => (
                      <div key={u.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg">
                            <Icon name="user" className="w-4 h-4" />
                          </span>
                          <span className="text-gray-700 font-medium truncate max-w-[150px]">
                            {u.name || u.user_id}
                          </span>
                        </div>
                        <span className="text-gray-800 font-semibold">${u.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
              <div className="overflow-x-auto">
                {recentTx.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent transactions</p>
                )}
                {recentTx.length > 0 && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTx.slice(0, 10).map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 font-mono">{(profilesMap[t.user_id || ''] as string) || t.user_id || '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{t.type || '—'}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                            ${Number(t.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                t.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : t.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {t.status || 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}

        {section === 'users' && <Users />}

        {section === 'transactions' && (
          <section>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Transactions</h3>
                <div className="flex gap-3 items-center">
                  <input
                    className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search transactions, user, account..."
                    value={txSearch}
                    onChange={(e) => {
                      setTxPage(0)
                      setTxSearch(e.target.value)
                    }}
                  />
                  <button
                    onClick={exportTransactionsCSV}
                    disabled={txLoading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-shadow duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {txLoading ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Loading…</td>
                      </tr>
                    )}
                    {!txLoading && transactionsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No transactions found</td>
                      </tr>
                    )}
                    {!txLoading && transactionsList.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => openTxDetails(t)}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">{(profilesMap[t.user_id || ''] as string) || t.user_id || '—'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{t.type}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                          ${Number(t.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              t.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : t.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {txTotal > 0 ? (
                    (() => {
                      const start = txPage * TX_PAGE_SIZE
                      const end = Math.min(start + transactionsList.length, txTotal)
                      return <span>{`${start + 1}–${end} of ${txTotal.toLocaleString()}`}</span>
                    })()
                  ) : (
                    <span>0 of 0</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                    disabled={txPage === 0}
                  >
                    ← Previous
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setTxPage((p) => p + 1)}
                    disabled={(txPage + 1) * TX_PAGE_SIZE >= txTotal}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {section === 'billers' && <Billers />}

        {section === 'system' && <SystemConfig />}

        {section === 'notifications' && <Notifications />}

        {section === 'reports' && <Reports />}

        {section === 'admins' && <Admins />}

        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedTx(null); setSelectedTxDetails(null) }} />
            <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl z-10">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-semibold">Transaction Details</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => { setSelectedTx(null); setSelectedTxDetails(null) }}>✕</button>
              </div>
              {detailLoading ? (
                <div className="py-8 text-center text-gray-500">Loading…</div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div><strong>Date:</strong> {selectedTxDetails?.created_at ? new Date(selectedTxDetails.created_at).toLocaleString() : selectedTx?.created_at ? new Date(selectedTx.created_at).toLocaleString() : '—'}</div>
                  <div><strong>From:</strong> {(profilesMap[selectedTx?.user_id || ''] as string) || selectedTx?.user_id || '—'}</div>
                  <div><strong>Amount:</strong> ${Number(selectedTxDetails?.amount ?? selectedTx?.amount ?? 0).toLocaleString()}</div>
                  <div><strong>Type:</strong> {selectedTxDetails?.type ?? selectedTx?.type ?? '—'}</div>
                  <div><strong>Status:</strong> {selectedTxDetails?.status ?? selectedTx?.status ?? '—'}</div>
                  <div><strong>Description:</strong> {selectedTxDetails?.description ?? selectedTx?.description ?? '—'}</div>
                  {selectedTxDetails && (
                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                      <div><strong>Counterparty:</strong> {selectedTxDetails?.counterparty || '—'}</div>
                      <div><strong>Recipient:</strong> {selectedTxDetails?.recipient_name || '—'}</div>
                      <div><strong>Reference / ID:</strong> <span className="font-mono">{selectedTxDetails?.id || selectedTx?.id}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
