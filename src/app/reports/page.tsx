import { AppShell } from '@/components/AppShell'
import { FileBarChart2, Sparkles, Clock } from 'lucide-react'

const SAMPLE_REPORTS = [
  {
    id: '1',
    address: '123 Palm Street, Miami, FL',
    rooms: ['Kitchen', 'Bathroom'],
    status: 'pending',
    date: 'Mar 10, 2026',
  },
  {
    id: '2',
    address: '456 Ocean Drive, Fort Lauderdale, FL',
    rooms: ['Living Room', 'Bedroom', 'Exterior'],
    status: 'pending',
    date: 'Mar 8, 2026',
  },
]

export default function ReportsPage() {
  return (
    <AppShell>
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              AI-generated renovation analysis for your properties.
            </p>
          </div>
        </div>

        {/* Coming soon banner */}
        <div className="flex items-start gap-4 p-5 mb-8 rounded-2xl
          bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-0.5">
              AI Analysis — Coming Soon
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              FlipVision AI will analyze your property photos room-by-room and generate detailed
              renovation reports with cost estimates and priority recommendations.
            </p>
          </div>
        </div>

        {/* Report list */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 mb-4">
            Queued for Analysis
          </p>

          {SAMPLE_REPORTS.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5
                flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FileBarChart2 className="w-5 h-5 text-slate-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{report.address}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {report.rooms.map((room) => (
                    <span
                      key={room}
                      className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                  text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-2.5 h-2.5" />
                  Pending
                </span>
                <p className="text-[10px] text-slate-400">{report.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty hint */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Reports will be generated automatically once AI analysis is enabled.
        </p>
      </main>
    </div>
    </AppShell>
  )
}
