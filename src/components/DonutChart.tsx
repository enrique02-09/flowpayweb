import React from 'react'
import Icon from './Icons'

type Slice = { label: string; value: number; color?: string }

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180.0)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

export default function DonutChart({ data, size = 220, inner = 0.6, title }: { data?: Slice[]; size?: number; inner?: number; title?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center">
          <div className="mb-3 text-gray-400"><Icon name="chartPie" className="w-12 h-12" /></div>
          <div className="text-gray-700 font-semibold">Donut Chart</div>
          <div className="text-sm text-gray-400 mt-1">No data for selected range</div>
        </div>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 0
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 6
  const innerR = outerR * inner
  const strokeWidth = outerR - innerR
  const radius = innerR + strokeWidth / 2
  const circumference = 2 * Math.PI * radius

  let acc = 0

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {title && <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>}
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* background circle (light) */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />

          {/* segments (stacked stroked circles) */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {data.map((d, i) => {
              const portion = total > 0 ? Math.max(0, d.value / total) : 0
              const dash = portion * circumference
              const gap = Math.max(0, circumference - dash)
              const color = d.color || defaultColors[i % defaultColors.length]
              const dashOffset = -acc
              acc += dash
              if (dash <= 0) return null
              return (
                <circle
                  key={d.label}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                />
              )
            })}
          </g>

          {/* center hole */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="#ffffff" />

          {/* center label (larger) */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fill="#111827" fontWeight={700}>{total.toLocaleString()}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize={12} fill="#6b7280">Total</text>
        </svg>

        <div className="flex-1">
          {data.map((d, i) => {
            const raw = d.label || ''
            const display = raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            return (
              <div key={d.label} className="flex items-center gap-3 mb-2">
                <span style={{ background: d.color || defaultColors[i % defaultColors.length] }} className="w-3 h-3 rounded-full" />
                <div className="flex-1 text-sm text-gray-700 truncate">{display}</div>
                <div className="text-sm text-gray-600 font-semibold">{Math.round((d.value / total) * 100) || 0}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const defaultColors = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']
