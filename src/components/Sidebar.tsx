
type Props = {
  active: string
  onNavigate: (key: string) => void
}

const items = [
  { key: 'overview', label: '📊 Overview', icon: '📊' },
  { key: 'users', label: '👥 User Management', icon: '👥' },
  { key: 'transactions', label: '💳 Transactions', icon: '💳' },
  { key: 'billers', label: '🧾 Bill Payments', icon: '🧾' },
  { key: 'system', label: '⚙️ System Config', icon: '⚙️' },
  { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
  { key: 'reports', label: '📈 Reports', icon: '📈' },
  { key: 'admins', label: '👤 Admin Accounts', icon: '👤' },
]

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="w-64 bg-white rounded-2xl shadow-lg p-6 h-screen sticky top-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          <span>FlowPay</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
      </div>
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  item.key === active
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
