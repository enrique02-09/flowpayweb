type Props = {
  message?: string
}

export default function LoadingOverlay({ message = 'Loading...' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white/95 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-14 w-14 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
            <path
              d="M22 12a10 10 0 00-10-10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-800">{message}</div>
          <div className="text-sm text-gray-500">Preparing your dashboard…</div>
        </div>
      </div>
    </div>
  )
}
