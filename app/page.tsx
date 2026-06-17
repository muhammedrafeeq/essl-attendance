'use client'

import { useEffect, useState, useCallback } from 'react'
import { AttendanceLog } from '@/lib/types'

const statusLabel: Record<string, string> = {
  '0': 'Check In',
  '1': 'Check Out',
  '2': 'Break Out',
  '3': 'Break In',
  '4': 'OT In',
  '5': 'OT Out',
}

const statusColors: Record<string, string> = {
  '0': 'bg-green-100 text-green-800',
  '1': 'bg-red-100 text-red-800',
  '2': 'bg-yellow-100 text-yellow-800',
  '3': 'bg-yellow-100 text-yellow-800',
  '4': 'bg-purple-100 text-purple-800',
  '5': 'bg-purple-100 text-purple-800',
}

export default function Home() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [filterDevice, setFilterDevice] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUserId, setFilterUserId] = useState('')

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterDevice) params.set('device', filterDevice)
    if (filterStatus) params.set('status', filterStatus)
    if (filterUserId) params.set('user_id', filterUserId)

    try {
      const res = await fetch(`/api/logs?${params}`)
      if (res.ok) {
        setLogs(await res.json())
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }, [filterDevice, filterStatus, filterUserId])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESSL Attendance</h1>
            <p className="text-gray-500 mt-1">Biometric device records</p>
          </div>
          <button
            onClick={fetchLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Device SN</label>
            <input
              type="text"
              placeholder="All devices"
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabel).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee ID</label>
            <input
              type="text"
              placeholder="All employees"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setFilterDevice(''); setFilterStatus(''); setFilterUserId('') }}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">No records found</p>
              <p className="text-sm mt-2">
                {filterDevice || filterStatus || filterUserId
                  ? 'Try adjusting your filters.'
                  : 'Waiting for device to push data...'}
              </p>
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
                      <td className="px-6 py-4 text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {statusLabel[log.status] ?? `Status ${log.status}`}
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
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Showing {logs.length} records · Auto-refreshes every 30s
          {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
        </p>
      </div>
    </main>
  )
}
