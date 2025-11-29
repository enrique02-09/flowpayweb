import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

type Biller = {
  id: string
  user_id?: string
  bill_type?: string
  amount?: number
  due_date?: string
  created_at?: string
  status?: string
}

// Provider data structure
const billCategories = [
  { 
    id: 'electricity', 
    name: 'Electricity', 
    providers: [
      { id: 'batelec-ii-balayan', name: 'BATELEC II - Balayan' },
      { id: 'batelec-ii-nasugbu', name: 'BATELEC II - Nasugbu' }
    ]
  },
  { 
    id: 'water', 
    name: 'Water', 
    providers: [
      { id: 'balayan-water-district', name: 'Balayan Water District' },
      { id: 'prime-water-nasugbu', name: 'Prime Water Nasugbu' },
      { id: 'lian-water-district', name: 'Lian Water District' }
    ]
  },
  { 
    id: 'internet', 
    name: 'Internet', 
    providers: [
      { id: 'pldt', name: 'PLDT' },
      { id: 'globe-home', name: 'Globe At Home' },
      { id: 'converge', name: 'Converge ICT' },
      { id: 'sky-cable', name: 'Sky Cable' },
      { id: 'dito-fiber', name: 'DITO Fiber' },
      { id: 'streamtech', name: 'Streamtech' }
    ]
  },
  { 
    id: 'phone', 
    name: 'Phone', 
    providers: [
      { id: 'globe', name: 'Globe Telecom' },
      { id: 'smart', name: 'Smart Communications' },
      { id: 'dito', name: 'DITO Telecommunity' },
      { id: 'sun', name: 'Sun Cellular' }
    ]
  },
  { 
    id: 'cable', 
    name: 'Cable TV', 
    providers: [
      { id: 'sky-cable-tv', name: 'Sky Cable' },
      { id: 'cignal', name: 'Cignal TV' },
      { id: 'gsat', name: 'G Sat' },
      { id: 'destiny-cable', name: 'Destiny Cable' }
    ]
  },
  { 
    id: 'others', 
    name: 'Others', 
    providers: [
      { id: 'sss', name: 'SSS Contribution/Loan' },
      { id: 'pagibig', name: 'Pag-IBIG Fund' },
      { id: 'philhealth', name: 'PhilHealth' },
      { id: 'insurance', name: 'Insurance Companies' },
      { id: 'credit-card', name: 'Credit Card Bills' },
      { id: 'government', name: 'Government Services' }
    ]
  },
]

export default function Billers() {
  const [billers, setBillers] = useState<Biller[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newBiller, setNewBiller] = useState<any>({ bill_type: '', amount: '', due_date: '', user_id: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [profileResults, setProfileResults] = useState<Array<any>>([])
  const [profileLoading, setProfileLoading] = useState(false)

  // profiles for dropdown selection in Add Biller modal

  const PAGE_SIZE = 10

  useEffect(() => {
    fetchBillers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function fetchBillers() {
    setLoading(true)
    setError(null)
    try {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query: any = supabase
        .from('bills')
        .select('id,user_id,bill_type,amount,due_date,created_at,status', { count: 'exact' })
        .order('due_date', { ascending: true })
        .range(from, to)

      if (search && search.trim()) {
        const q = `%${search.trim()}%`
        query = supabase
          .from('bills')
          .select('id,user_id,bill_type,amount,due_date,created_at,status', { count: 'exact' })
          .or(`bill_type.ilike.${q},status.ilike.${q},user_id.eq.${search.trim()}`)
          .order('due_date', { ascending: true })
          .range(from, to)
      }

      const { data, error: err, count } = await query
      if (err) throw err
      setBillers((data || []) as Biller[])
      setTotal(Number(count ?? 0))
    } catch (e: any) {
      setError(e?.message || 'Failed to load billers')
    } finally {
      setLoading(false)
    }
  }

  async function addBiller(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      // Log any extra fields for all bill types
      if (newBiller.bill_type && ['Electricity', 'Water', 'Internet', 'Phone', 'Cable TV', 'Others'].includes(newBiller.bill_type)) {
        // eslint-disable-next-line no-console
        console.log(`Adding ${newBiller.bill_type.toLowerCase()} biller with details:`, {
          provider: newBiller.provider,
          reference: newBiller.reference,
          recipient_name: newBiller.recipient_name,
          recipient_email: newBiller.recipient_email,
        })
      }
      
      const payload: any = {
        bill_type: newBiller.bill_type,
        amount: Number(newBiller.amount || 0),
        due_date: newBiller.due_date || null,
        created_at: new Date().toISOString(),
        status: 'active',
      }
      if (newBiller.user_id) payload.user_id = newBiller.user_id
      const { error } = await supabase.from('bills').insert(payload)
      if (error) throw error
      setNewBiller({ bill_type: '', amount: '', due_date: '', user_id: '', provider: '', reference: '', recipient_name: '', recipient_email: '' })
      setPage(0)
      fetchBillers()
    } catch (e: any) {
      setError(e?.message || 'Failed to add biller')
    }
  }

  

  async function loadProfiles() {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id,account_number,fullname,email')
        .order('account_number', { ascending: true })
        .limit(100)
      if (error) throw error
      setProfileResults(data || [])
    } catch (e) {
      setProfileResults([])
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (showAddModal) loadProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal])

  // Helper function to get providers for current bill type
  const getCurrentProviders = () => {
    const category = billCategories.find(cat => cat.name === newBiller.bill_type);
    return category ? category.providers : [];
  }

  // Check if current bill type should show provider fields
  const shouldShowProviderFields = () => {
    return ['Electricity', 'Water', 'Internet', 'Phone', 'Cable TV', 'Others'].includes(newBiller.bill_type);
  }

  // Get the label for reference number field based on bill type
  const getReferenceFieldLabel = () => {
    switch (newBiller.bill_type) {
      case 'Internet':
        return 'Account Number';
      case 'Phone':
        return 'Phone Number';
      case 'Cable TV':
        return 'Account Number';
      default:
        return 'Biller Reference Number';
    }
  }

  // Get placeholder text for reference number field based on bill type
  const getReferenceFieldPlaceholder = () => {
    switch (newBiller.bill_type) {
      case 'Internet':
        return 'Enter internet account number';
      case 'Phone':
        return 'Enter phone number';
      case 'Cable TV':
        return 'Enter cable TV account number';
      case 'Electricity':
        return 'Enter electricity reference number';
      case 'Water':
        return 'Enter water reference number';
      default:
        return 'Enter biller reference number';
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Bill Payment Management</h3>
          <p className="text-gray-500 mt-1">Add billers and monitor upcoming payments.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
            onClick={() => setShowAddModal(true)}
          >
            + New Biller
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search billers..."
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value) }}
          />
        </div>
        <div className="text-sm text-gray-600">Total: <strong>{total.toLocaleString()}</strong></div>
      </div>

      {/* Add biller modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-md z-10">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">Add Biller</h4>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => { addBiller(e); setShowAddModal(false) }} className="mt-4 space-y-3">
              <label className="block text-sm text-gray-700">Category
                <select
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBiller.bill_type}
                  onChange={(e) => setNewBiller((s: any) => ({ ...s, bill_type: e.target.value }))}
                >
                  <option value="">Select a category</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Internet">Internet</option>
                  <option value="Phone">Phone</option>
                  <option value="Cable TV">Cable TV</option>
                  <option value="Others">Others</option>
                </select>
              </label>

              <label className="block text-sm text-gray-700">Amount
                <input
                  required
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount"
                  value={newBiller.amount}
                  onChange={(e) => setNewBiller((s: any) => ({ ...s, amount: e.target.value }))}
                />
              </label>

              <label className="block text-sm text-gray-700">Due date
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBiller.due_date}
                  onChange={(e) => setNewBiller((s: any) => ({ ...s, due_date: e.target.value }))}
                />
              </label>

              {/* Provider fields for all bill types */}
              {shouldShowProviderFields() && (
                <div className="space-y-3">
                  <label className="block text-sm text-gray-700">Provider
                    <select
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newBiller.provider || ''}
                      onChange={(e) => setNewBiller((s: any) => ({ ...s, provider: e.target.value }))}
                    >
                      <option value="">Select provider</option>
                      {getCurrentProviders().map((provider) => (
                        <option key={provider.id} value={provider.name}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-gray-700">
                    {getReferenceFieldLabel()}
                    <input
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder={getReferenceFieldPlaceholder()}
                      value={newBiller.reference || ''}
                      onChange={(e) => setNewBiller((s: any) => ({ ...s, reference: e.target.value }))}
                    />
                  </label>

                  <label className="block text-sm text-gray-700">Recipient Name
                    <input
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter recipient full name"
                      value={newBiller.recipient_name || ''}
                      onChange={(e) => setNewBiller((s: any) => ({ ...s, recipient_name: e.target.value }))}
                    />
                  </label>

                  <label className="block text-sm text-gray-700">Recipient Email
                    <input
                      type="email"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter recipient email"
                      value={newBiller.recipient_email || ''}
                      onChange={(e) => setNewBiller((s: any) => ({ ...s, recipient_email: e.target.value }))}
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700">Select Account Number</label>
                <div className="relative">
                  <select
                    aria-label="Select account number"
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={newBiller.user_id || ''}
                    onChange={(e) => {
                      const id = e.target.value
                      const p = profileResults.find((pr) => pr.id === id)
                      setNewBiller((s: any) => ({
                        ...s,
                        user_id: id || '',
                        account_number: p?.account_number || '',
                        recipient_name: p?.fullname || s.recipient_name,
                        recipient_email: p?.email || s.recipient_email,
                      }))
                    }}
                  >
                    <option value="">Select an account</option>
                    {profileLoading && <option disabled>Loading profiles…</option>}
                    {!profileLoading && profileResults.map((p) => (
                      <option key={p.id} value={p.id}>{`${p.account_number} — ${p.fullname || p.email || p.id}`}</option>
                    ))}
                  </select>
                  {profileLoading && <div className="absolute right-3 top-3 text-xs text-gray-500">…</div>}
                </div>
              </div>

              {/* show autofilled name/email when account selected */}
              {newBiller.account_number && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">Name</div>
                  <div className="text-sm font-medium text-gray-800">{newBiller.recipient_name || '—'}</div>
                  <div className="text-sm text-gray-700">Email</div>
                  <div className="text-sm font-medium text-gray-800">{newBiller.recipient_email || '—'}</div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-3">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Biller</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Biller</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Due</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Owner</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && billers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">No billers found</td>
              </tr>
            )}
            {!loading && billers.map((b) => (
              <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-800 font-medium">{b.bill_type || '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-700">₱{Number(b.amount ?? 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{b.due_date ? new Date(b.due_date).toLocaleDateString() : '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {b.status || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 font-mono">{b.user_id || '—'}</td>
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
              const end = Math.min(start + billers.length, total)
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
    </div>
  )
}