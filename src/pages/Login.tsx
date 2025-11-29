import { useState } from 'react'
import { login } from '../services/auth'
import Icon from '../components/Icons'
import logo from '../assets/FlowPay_Tagline.png'
import adminlog from '../assets/adminlog.png'
import loginBg from '../assets/login-bg.svg'
import LoadingOverlay from '../components/LoadingOverlay'

type Props = {
  onLogin: () => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setIsSubmitting(true)
    try {
      await login(email, password)
      // keep the spinner and show a short transition before navigating
      setShowTransition(true)
      await new Promise((res) => setTimeout(res, 900))
      onLogin()
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-10" style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden' }}>
        <div className="login-split flex gap-6 items-center">
        {/* Left illustration */}
        <div className="login-left flex-1 hidden lg:flex items-center justify-center">
          <img
            src={adminlog}
            alt="Office illustration"
            className="login-illustration object-contain"
            style={{ maxHeight: 420, width: '100%' }}
            onError={(e: any) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Right: login form */}
        <div className="login-right flex-1 max-w-lg" style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center right' }}>
          <div className="login-panel bg-white p-6 rounded-xl shadow">
            <div className="text-center mb-6">
              <img src={logo} alt="FlowPay" className="mx-auto h-12 object-contain mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h2>
              <p className="text-gray-500">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@flowpay.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || showTransition}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-4 rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isSubmitting && !showTransition ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
              <Icon name="lock" className="w-4 h-4 text-gray-500" />
              <span>Secure admin access only</span>
            </p>
          </div>
        </div>
      </div>
      </div>

      {showTransition && <LoadingOverlay message="Signing in" />}
    </div>
  )
}
