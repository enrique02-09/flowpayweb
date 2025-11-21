type Props = {
  title: string
  value: string
  hint?: string
  icon?: string
  color?: string
}

export default function StatsCard({ title, value, hint, icon = '📊', color = 'blue' }: Props) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
  }[color] || 'from-blue-500 to-cyan-500'

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span className={`text-3xl p-3 rounded-xl bg-gradient-to-br ${colorClasses} text-white shadow-lg`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  )
}
