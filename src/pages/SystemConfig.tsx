import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export default function SystemConfig() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const { data } = await supabase.from('settings').select('*')
      const map: Record<string, string> = {}
      ;[...(data || [])].forEach((s: any) => { map[s.key] = String(s.value ?? '') })
      setSettings(map)
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false)
    }
  }

  function detectBoolean(key: string) {
    return /enable|enabled|mode|maintenance|active|on|off/i.test(key)
  }

  async function saveSetting(key: string, value: string) {
    setSavingKey(key)
    try {
      await supabase.from('settings').upsert({ key, value })
      await fetchSettings()
    } catch (e) {
      // swallow for now
    } finally {
      setSavingKey(null)
    }
  }

  async function removeSetting(key: string) {
    if (!window.confirm(`Delete setting \"${key}\"?`)) return
    try {
      await supabase.from('settings').delete().eq('key', key)
      await fetchSettings()
    } catch (e) {
      // ignore
    }
  }

  async function addNewSetting(e?: React.FormEvent) {
    e?.preventDefault()
    if (!newKey) return
    await saveSetting(newKey, newValue)
    setNewKey('')
    setNewValue('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">System Configuration</h3>
          <p className="text-gray-500 mt-1">Manage global settings (limits, toggles, contact info).</p>
        </div>
        <div className="text-sm text-gray-600">Last synced: <span className="font-medium">{loading ? 'Loading…' : 'Now'}</span></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {loading && (
              <div className="p-6 text-center text-gray-500">Loading settings…</div>
            )}

            {!loading && Object.keys(settings).length === 0 && (
              <div className="p-6 text-gray-500">No settings found. Add a new setting.</div>
            )}

            {!loading && Object.entries(settings).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="w-48 text-sm text-gray-600">{key}</div>
                <div className="flex-1">
                  {detectBoolean(key) ? (
                    <label className="inline-flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={String(val) === 'true' || val === '1'}
                        onChange={(e) => saveSetting(key, e.target.checked ? 'true' : 'false')}
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-700">{String(val)}</span>
                    </label>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={val}
                        onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                      />
                      <button
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                        onClick={() => saveSetting(key, settings[key])}
                        disabled={savingKey === key}
                      >
                        {savingKey === key ? 'Saving…' : 'Save'}
                      </button>
                      <button className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100" onClick={() => removeSetting(key)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Add New Setting</h4>
          <form onSubmit={addNewSetting} className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Key</label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. transaction_limit" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Value</label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. 100000" />
            </div>
            <div className="flex items-center justify-end">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Add</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}