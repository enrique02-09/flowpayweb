export default function PlaceholderChart({ title }: { title?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 font-medium">Chart Visualization</p>
          <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
        </div>
      </div>
    </div>
  )
}
