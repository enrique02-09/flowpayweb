export default function PlaceholderChart({ title }: { title?: string }) {
  return (
    <div className="placeholder-chart">
      {title && <div className="chart-title">{title}</div>}
      <div className="chart-body">(chart placeholder)</div>
    </div>
  )
}
