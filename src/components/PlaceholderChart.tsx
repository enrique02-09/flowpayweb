import Icon from './Icons'

type Point = { label: string; value: number }

export default function PlaceholderChart({ title, data, type = 'line', height = 200 }: { title?: string; data?: Point[]; type?: 'line' | 'bar'; height?: number }) {
  // If no data provided, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="mb-2 text-gray-400"><Icon name="chartBar" className="w-12 h-12" /></div>
            <p className="text-gray-500 font-medium">Chart Visualization</p>
            <p className="text-sm text-gray-400 mt-1">No data for selected range</p>
          </div>
        </div>
      </div>
    )
  }

  // compute bounds
  const values = data.map((d) => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const padding = 12
  const w = Math.max(300, data.length * 48)
  const h = height

  const toX = (i: number) => padding + (i * (w - padding * 2)) / Math.max(1, data.length - 1)
  const toY = (v: number) => padding + (1 - (v - min) / Math.max(1, max - min)) * (h - padding * 2)

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.value)}`).join(' ')

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div className="overflow-auto">
        <svg className="w-full" viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMinYMin meet">
          <rect x={0} y={0} width={w} height={h} fill="url(#bg)" rx={12} />
          <defs>
            <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
            <line key={idx} x1={padding} x2={w - padding} y1={padding + t * (h - padding * 2)} y2={padding + t * (h - padding * 2)} stroke="#eef2f7" />
          ))}

          {/* bars or line */}
          {type === 'bar' ? (
            data.map((d, i) => {
              const barW = (w - padding * 2) / data.length * 0.7
              const x = toX(i) - barW / 2
              const y = toY(d.value)
              const barH = Math.max(2, h - padding - y)
              return <rect key={i} x={x} y={y} width={barW} height={barH} rx={4} fill="#06b6d4"><title>{d.label}: {d.value}</title></rect>
            })
          ) : (
            <>
              <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) => (
                <circle key={i} cx={toX(i)} cy={toY(d.value)} r={3.5} fill="#06b6d4"><title>{d.label}: {d.value}</title></circle>
              ))}
            </>
          )}

          {/* x labels */}
          {data.map((d, i) => (
            <text key={i} x={toX(i)} y={h - 4} fontSize={10} textAnchor="middle" fill="#64748b">{d.label}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}
