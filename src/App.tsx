import { useEffect, useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { isAuthenticated } from './services/auth'
import { supabase } from './services/supabase'

function App() {
  const [authed, setAuthed] = useState<boolean>(false)

  useEffect(() => {
    // try existing token quick check
    if (isAuthenticated()) {
      // validate server-side session & role
      ;(async () => {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          setAuthed(false)
          return
        }
        const { data: profile } = await supabase.from('profile').select('role,is_admin').eq('id', user.id).single()
        setAuthed(!!profile && (profile.role === 'admin' || profile.is_admin === true))
      })()
    }
  }, [])

  function handleLogin() { setAuthed(true) }
  function handleLogout() { setAuthed(false) }

  return (
    <div className={`app-root ${authed ? 'admin-mode' : ''}`}>
      {authed ? <Dashboard onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
    </div>
  )
}

export default App
