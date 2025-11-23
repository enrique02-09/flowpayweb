
import Icon from './Icons'
import logo from '../assets/FlowPay_Tagline.png'

type Props = {
  active: string
  onNavigate: (key: string) => void
}

const items = [
  { key: 'overview', label: 'Overview', icon: 'chartBar' },
  { key: 'users', label: 'User Management', icon: 'user' },
  { key: 'transactions', label: 'Transactions', icon: 'creditCard' },
  { key: 'billers', label: 'Bill Payments', icon: 'bill' },
  { key: 'reports', label: 'Reports', icon: 'chartLine' },
  { key: 'admins', label: 'Admin Accounts', icon: 'user' },
]

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="w-64 bg-white rounded-2xl shadow-lg p-6 h-screen sticky top-0">
      <div className="mb-8 flex items-center justify-center">
        <img src={logo} alt="FlowPay" className="h-24 md:h-20 object-contain" />
      </div>
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                  item.key === active
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon name={item.icon} className="w-5 h-5 text-current" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
