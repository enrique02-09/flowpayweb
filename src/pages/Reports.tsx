import { useEffect, useState } from 'react'
import { saveAs } from 'file-saver'
import { supabase } from '../services/supabase'
import StatsCard from '../components/StatsCard'
import PlaceholderChart from '../components/PlaceholderChart'
import Icon from '../components/Icons'

type Tx = { id: string; created_at?: string; user_id?: string; type?: string; amount?: number; status?: string; description?: string }

export default function Reports() {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const [total, setTotal] = useState(0)

  const [summary, setSummary] = useState({ totalTx: 0, totalAmount: 0, avgAmount: 0 })
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([])

  useEffect(() => { fetchReport(page) }, [fromDate, toDate, typeFilter, statusFilter, page])

  function escapeCsvCell(v: any) {
    if (v == null) return ''
    const s = String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  async function exportCSV() {
    setLoading(true)
    try {
      let q: any = supabase
        .from('transactions')
        .select('id,created_at,user_id,type,amount,status,description')
        .order('created_at', { ascending: false })

      if (fromDate) q = q.gte('created_at', new Date(fromDate).toISOString())
      if (toDate) {
        const d = new Date(toDate); d.setHours(23,59,59,999)
        q = q.lte('created_at', d.toISOString())
      }
      if (typeFilter) q = q.eq('type', typeFilter)
      if (statusFilter) q = q.eq('status', statusFilter)

      const { data, error } = await q.limit(20000)
      if (error) throw error

      const rows = (data || []) as any[]
      const headers = ['id','created_at','user_id','type','amount','status','description']
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => escapeCsvCell(r[h])).join(','))).join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `report_transactions_${new Date().toISOString().slice(0,10)}.csv`)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  async function fetchReport(pageIndex = 0) {
    setLoading(true)
    try {
      const from = pageIndex * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q: any = supabase
        .from('transactions')
        .select('id,created_at,user_id,type,amount,status,description', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (fromDate) q = q.gte('created_at', new Date(fromDate).toISOString())
      if (toDate) { const d = new Date(toDate); d.setHours(23,59,59,999); q = q.lte('created_at', d.toISOString()) }
      if (typeFilter) q = q.eq('type', typeFilter)
      if (statusFilter) q = q.eq('status', statusFilter)

      const { data, error, count } = await q.range(from, to)
      if (error) throw error
      setTransactions((data || []) as Tx[])
      setTotal(Number(count ?? 0))

      // compute summary client-side for now
      // Note: previously an aggregate query was issued here but its result wasn't used.
      // We compute summary from the fetched page for simplicity.
      const totalAmount = (data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      const totalTx = Number(count ?? (data || []).length)
      setSummary({ totalTx, totalAmount, avgAmount: totalTx ? totalAmount / totalTx : 0 })

      // build chart data: aggregate by month for the selected range and filters
      try {
        let q2: any = supabase
          .from('transactions')
          .select('created_at,amount')
          .order('created_at', { ascending: true })

        if (fromDate) q2 = q2.gte('created_at', new Date(fromDate).toISOString())
        if (toDate) { const d = new Date(toDate); d.setHours(23,59,59,999); q2 = q2.lte('created_at', d.toISOString()) }
        if (typeFilter) q2 = q2.eq('type', typeFilter)
        if (statusFilter) q2 = q2.eq('status', statusFilter)

        const { data: chartRows, error: chartError } = await q2.limit(20000)
        if (chartError) throw chartError

        const map = new Map<string, number>()
        ;(chartRows || []).forEach((r: any) => {
          if (!r || !r.created_at) return
          const d = new Date(r.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const prev = map.get(key) || 0
          map.set(key, prev + Number(r.amount || 0))
        })

        const arr = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => {
          const [y, m] = k.split('-').map(Number)
          const lbl = new Date(y, (m || 1) - 1).toLocaleString(undefined, { month: 'short', year: 'numeric' })
          return { label: lbl, value: Math.round(v) }
        })
        setChartData(arr)
      } catch (ee) {
        console.error('chart data error', ee)
        setChartData([])
      }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Reports & Analytics</h3>
          <p className="text-gray-500 mt-1">Generate transaction reports and export data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl" onClick={exportCSV} disabled={loading}>
            <Icon name="download" className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600">From</label>
              <input type="date" value={fromDate} onChange={(e) => { setPage(0); setFromDate(e.target.value) }} className="px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600">To</label>
              <input type="date" value={toDate} onChange={(e) => { setPage(0); setToDate(e.target.value) }} className="px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <select value={typeFilter} onChange={(e) => { setPage(0); setTypeFilter(e.target.value) }} className="px-3 py-2 border border-gray-200 rounded-lg">
              <option value="">All types</option>
              <option value="transfer">Transfer</option>
              <option value="payment">Payment</option>
              <option value="deposit">Deposit</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }} className="px-3 py-2 border border-gray-200 rounded-lg">
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-xl" onClick={() => { setPage(0); fetchReport(0) }}>Apply</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Total Transactions" value={loading ? '...' : String(summary.totalTx)} icon="chartLine" color="blue" />
            <StatsCard title="Total Amount" value={loading ? '...' : `₱${summary.totalAmount.toLocaleString()}`} icon="creditCard" color="green" />
            <StatsCard title="Average" value={loading ? '...' : `₱${Math.round(summary.avgAmount).toLocaleString()}`} icon="chartBar" color="purple" />
          </div>

          <PlaceholderChart title="Transaction Volume" data={chartData} type="bar" height={220} />
        </div>

        {/* Quick Actions removed (no functionality) */}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b-2 border-gray-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                  <td className="py-3 px-4 text-sm font-mono">{t.user_id || '—'}</td>
                  <td className="py-3 px-4 text-sm">{t.type || '—'}</td>
                  <td className="py-3 px-4 text-sm font-semibold">₱{Number(t.amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">{t.status || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{t.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page+1)*PAGE_SIZE, total)} of ${total}` : '0 of 0'}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-gray-100 rounded-lg" onClick={() => { setPage((p) => Math.max(0, p-1)); fetchReport(Math.max(0, page-1)) }} disabled={page === 0}>← Prev</button>
            <button className="px-3 py-2 bg-gray-100 rounded-lg" onClick={() => { setPage((p) => p+1); fetchReport(page+1) }} disabled={(page+1)*PAGE_SIZE >= total}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}