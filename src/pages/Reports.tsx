import { saveAs } from 'file-saver'
import { supabase } from '../services/supabase'

export default function Reports() {
  async function exportTransactionsCSV() {
    const { data, error } = await supabase
      .from('transactions')
      .select('id,created_at,user_id,type,amount,status,description')
      .order('created_at', { ascending: false })
      .limit(10000) // adjust as needed or use server-side function for large exports

    if (error) {
      console.error(error)
      return
    }
    const rows = (data || [])
    const headers = ['id','created_at','user_id','type','amount','status','description']
    const csv = [headers.join(',')]
      .concat(rows.map((r: any) => headers.map(h => `"${String(r[h] ?? '')}".replace(/"/g,'""')`).join(',')))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `transactions_export_${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <h3>Reports & Analytics</h3>
      <p>Generate and export reports.</p>

      <div style={{ marginTop: 12 }}>
        <button onClick={exportTransactionsCSV}>Export Transactions (CSV)</button>
      </div>
    </div>
  )
}