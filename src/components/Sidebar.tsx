
type Props = {
  active: string
  onNavigate: (key: string) => void
}

const items = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'User Management' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'billers', label: 'Bill Payments' },
  { key: 'system', label: 'System Config' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'reports', label: 'Reports' },
  { key: 'admins', label: 'Admin Accounts' },
]

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <nav className="sidebar">
      <div className="brand">FlowPay Admin</div>
      <ul>
        {items.map((it) => (
          <li key={it.key} className={it.key === active ? 'active' : ''} onClick={() => onNavigate(it.key)}>
            {it.label}
          </li>
        ))}
      </ul>
    </nav>
  )
}
