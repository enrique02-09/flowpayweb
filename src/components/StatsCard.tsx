type Props = {
  title: string
  value: string
  hint?: string
}

export default function StatsCard({ title, value, hint }: Props) {
  return (
    <div className="stats-card">
      <div className="stats-title">{title}</div>
      <div className="stats-value">{value}</div>
      {hint && <div className="stats-hint">{hint}</div>}
    </div>
  )
}
