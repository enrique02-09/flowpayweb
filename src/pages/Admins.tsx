import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type Profile = { id: string; fullname?: string; email?: string; is_admin?: boolean; role?: string }

export default function Admins() {
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAdmins() }, [])

  async function fetchAdmins() {
    setLoading(true)
    const { data } = await supabase.from('profile').select('id,fullname,email,is_admin,role').or('is_admin.eq.true,role.eq.admin').limit(200)
    setAdmins(data || [])
    setLoading(false)
  }

  async function toggleAdmin(p: Profile) {
    await supabase.from('profile').update({ is_admin: !p.is_admin }).eq('id', p.id)
    fetchAdmins()
  }

  return (
    <div>
      <h3>Admin Accounts</h3>
      <p>Manage admin users and roles.</p>

      {loading ? <div>Loading…</div> : (
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Admin</th><th>Action</th></tr></thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td>{a.fullname}</td>
                <td>{a.email}</td>
                <td>{a.role}</td>
                <td>{String(a.is_admin)}</td>
                <td><button onClick={() => toggleAdmin(a)}>{a.is_admin ? 'Revoke' : 'Make Admin'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}