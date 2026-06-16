'use client'

import { useEffect, useState } from 'react'
import { AttendanceLog } from '@/lib/types'
import { DeviceUser } from '@/lib/users'

const LS_KEY = 'essl_attendance_logs'

function loadFromStorage(): AttendanceLog[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as AttendanceLog[]) : []
  } catch {
    return []
  }
}

function saveToStorage(logs: AttendanceLog[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(logs))
  } catch {
    // storage quota exceeded — ignore
  }
}

type Tab = 'attendance' | 'users'

const statusLabel: Record<string, string> = {
  '0': 'Check In',
  '1': 'Check Out',
  '2': 'Break Out',
  '3': 'Break In',
  '4': 'OT In',
  '5': 'OT Out',
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('attendance')
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [users, setUsers] = useState<DeviceUser[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncSN, setSyncSN] = useState('')
  const [syncMsg, setSyncMsg] = useState('')

  const fetchData = async () => {
    try {
      const [logsRes, syncRes] = await Promise.all([
        fetch('/api/logs'),
        fetch('/api/sync'),
      ])
      if (logsRes.ok) {
        const data: AttendanceLog[] = await logsRes.json()
        setLogs(data)
        saveToStorage(data)
      }
      if (syncRes.ok) {
        const data = await syncRes.json()
        setUsers(data.users ?? [])
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = loadFromStorage()
    if (cached.length > 0) {
      setLogs(cached)
      setLoading(false)
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const triggerSync = async () => {
    if (!syncSN.trim()) {
      setSyncMsg('Enter a device serial number first.')
      return
    }
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch(`/api/sync?SN=${encodeURIComponent(syncSN.trim())}`, { method: 'POST' })
      const data = await res.json()
      setSyncMsg(data.message ?? 'Command queued.')
    } catch {
      setSyncMsg('Failed to queue sync command.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESSL Attendance</h1>
            <p className="text-gray-500 mt-1">Biometric device records</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => { localStorage.removeItem(LS_KEY); setLogs([]) }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Clear Cache
            </button>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Sync bar */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700">Sync device users:</span>
          <input
            type="text"
            placeholder="Device Serial Number"
            value={syncSN}
            onChange={(e) => setSyncSN(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            {syncing ? 'Queuing…' : 'Sync Users'}
          </button>
          {syncMsg && <span className="text-sm text-gray-500">{syncMsg}</span>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(['attendance', 'users'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'attendance' ? `Attendance (${logs.length})` : `Users (${users.length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading...</span>
            </div>
          ) : tab === 'attendance' ? (
            logs.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl">No attendance records found</p>
                <p className="text-sm mt-2">Waiting for device to push data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left">Employee ID</th>
                      <th className="px-6 py-3 text-left">Timestamp</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Verify</th>
                      <th className="px-6 py-3 text-left">Device SN</th>
                      <th className="px-6 py-3 text-left">Received At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{log.user_id}</td>
                        <td className="px-6 py-4 text-gray-700">{log.timestamp}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === '0' ? 'bg-green-100 text-green-800'
                            : log.status === '1' ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                            {statusLabel[log.status] || `Status ${log.status}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{log.verify}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.device_sn}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            users.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl">No users synced yet</p>
                <p className="text-sm mt-2">Enter a device serial number above and click Sync Users.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left">PIN</th>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Card</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Device SN</th>
                      <th className="px-6 py-3 text-left">Synced At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={`${u.device_sn}-${u.pin}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{u.pin}</td>
                        <td className="px-6 py-4 text-gray-700">{u.name || '—'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.card || '—'}</td>
                        <td className="px-6 py-4 text-gray-500">{u.role === '14' ? 'Admin' : 'User'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.device_sn}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(u.synced_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Auto-refreshes every 30 seconds · Showing last 100 attendance records
          {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
        </p>
      </div>
    </main>
  )
}
