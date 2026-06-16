'use client'

import { useEffect, useState } from 'react'
import { AttendanceLog } from '@/lib/types'

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

export default function Home() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs')
      if (res.ok) {
        const data: AttendanceLog[] = await res.json()
        setLogs(data)
        saveToStorage(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Show cached logs immediately while fetching fresh data
    const cached = loadFromStorage()
    if (cached.length > 0) {
      setLogs(cached)
      setLoading(false)
    }
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusLabel: Record<string, string> = {
    '0': 'Check In',
    '1': 'Check Out',
    '2': 'Break Out',
    '3': 'Break In',
    '4': 'OT In',
    '5': 'OT Out',
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESSL Attendance Logs</h1>
            <p className="text-gray-500 mt-1">Biometric device attendance records</p>
          </div>
          <div className="text-right flex gap-2 items-start">
            <button
              onClick={() => {
                localStorage.removeItem(LS_KEY)
                setLogs([])
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Clear Cache
            </button>
            <div>
              <button
                onClick={fetchLogs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading attendance logs...</span>
            </div>
          ) : logs.length === 0 ? (
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === '0'
                              ? 'bg-green-100 text-green-800'
                              : log.status === '1'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {statusLabel[log.status] || `Status ${log.status}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{log.verify}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.device_sn}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Auto-refreshes every 30 seconds · Showing last 100 records
        </p>
      </div>
    </main>
  )
}
