import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, CounselorNote, StressClassification, StudentUser } from '../../api/client'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>()
  const [student, setStudent] = useState<StudentUser | null>(null)
  const [notes, setNotes] = useState<CounselorNote[]>([])
  const [history, setHistory] = useState<StressClassification[]>([])
  const [latestReading, setLatestReading] = useState<StressClassification | null>(null)
  const [liveLoading, setLiveLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [saving, setSaving] = useState(false)
  const noteFormRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!studentId) return

    api.get(`/students/${studentId}`).then((res) => setStudent(res.data))
    api.get(`/students/${studentId}/notes`).then((res) => setNotes(res.data))
    api.get(`/students/${studentId}/stress/history`).then((res) => setHistory(res.data))

    const fetchLatestReading = () => {
      setLiveLoading(true)
      api
        .get(`/students/${studentId}/stress/latest`)
        .then((res) => {
          const nextLatest = res.data
          setLatestReading(nextLatest)
          setHistory((prevHistory) => {
            if (!nextLatest) {
              return prevHistory
            }

            const latestId = nextLatest.id
            const deduped = prevHistory.filter((item) => item.id !== latestId)
            return [nextLatest, ...deduped].slice(0, 200)
          })
        })
        .catch(() => setLatestReading(null))
        .finally(() => setLiveLoading(false))
    }

    fetchLatestReading()
    const interval = setInterval(fetchLatestReading, 5000)
    return () => clearInterval(interval)
  }, [studentId])

  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    if (!noteText.trim() || !studentId) return

    setSaving(true)
    try {
      const res = await api.post('/notes', {
        student_id: Number(studentId),
        note: noteText,
        recommendation: recommendation || null,
      })
      setNotes((prev) => [res.data, ...prev])
      setNoteText('')
      setRecommendation('')
    } finally {
      setSaving(false)
    }
  }

  const latest = history[0]
  const highStressAlerts = history.filter((h) => h.stress_level === 'stress').length
  const mildStressAlerts = history.filter((h) => h.stress_level === 'mild_stress').length
  const calmReadings = history.filter((h) => h.stress_level === 'non_stress').length
  const currentStatus =
    latest?.stress_level === 'stress'
      ? 'High'
      : latest?.stress_level === 'mild_stress'
      ? 'Mild'
      : latest?.stress_level === 'non_stress'
      ? 'Calm'
      : 'No data'
  const latestReadingLabel = latestReading?.stress_level ? latestReading.stress_level.replace('_', ' ') : 'Unknown'
  const latestReadingStatusText = liveLoading
    ? 'Fetching latest reading…'
    : latestReading?.stress_level
    ? latestReading.stress_level.replace('_', ' ')
    : 'No live reading yet.'

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl">Student wellbeing</h1>
          <p className="text-muted mt-2 sm:text-sm">Track stress readings, session notes, and current alerts for this student.</p>
        </div>
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <Link to="/counselor" className="btn-ghost btn-sm">
            Back to list
          </Link>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => noteFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Add note
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-muted text-xs uppercase tracking-[0.25em]">Overview</p>
                <h2 className="font-display text-2xl mt-3">Current student status</h2>
                <p className="text-muted mt-3 max-w-xl">A quick view of readings and notes for the selected student.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-surface border border-border p-4">
                  <p className="text-muted text-xs">High stress alerts</p>
                  <p className="font-display text-2xl mt-3">{highStressAlerts}</p>
                </div>
                <div className="rounded-3xl bg-surface border border-border p-4">
                  <p className="text-muted text-xs">Current status</p>
                  <p className="font-display text-2xl mt-3">{currentStatus}</p>
                </div>
                <div className="rounded-3xl bg-surface border border-border p-4">
                  <p className="text-muted text-xs">Notes captured</p>
                  <p className="font-display text-2xl mt-3">{notes.length}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted text-xs">Recent stress history</p>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-calm" />Calm</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-mild" />Mild</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-alert" />High</span>
                </div>
              </div>
              <div className="h-56">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={history
                        .slice()
                        .reverse()
                        .map((h) => ({
                          ...h,
                          time: new Date(h.classified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          value: h.stress_level === 'stress' ? 3 : h.stress_level === 'mild_stress' ? 2 : 1,
                        }))}
                      margin={{ top: 8, right: 12, left: -10, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F97316" stopOpacity={0.65} />
                          <stop offset="100%" stopColor="#F97316" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis
                        type="number"
                        domain={[1, 3]}
                        tickCount={3}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) =>
                          value === 3 ? 'High' : value === 2 ? 'Mild' : 'Calm'
                        }
                      />
                      <Tooltip
                        cursor={{ stroke: '#D1D5DB', strokeWidth: 1, opacity: 0.7 }}
                        formatter={(value: number) =>
                          value === 3 ? 'High stress' : value === 2 ? 'Mild stress' : 'Calm'
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#F97316"
                        fill="url(#stressGradient)"
                        strokeWidth={2}
                        activeDot={{ r: 5, stroke: '#F97316', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted text-sm">No readings yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl">Notes</h2>
                <p className="text-muted text-sm">Recent counselor notes for this student.</p>
              </div>
            </div>
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="glass-card p-4">
                  <p className="text-sm">{n.note}</p>
                  {n.recommendation && <p className="text-calm text-xs mt-2">→ {n.recommendation}</p>}
                  <p className="text-muted text-xs mt-3">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="glass-card p-4 text-center text-muted text-sm">No session notes yet — add the first one above.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="mb-4 space-y-2">
              <p className="text-muted text-xs">Student profile</p>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="rounded-full bg-surface px-3 py-1 text-sm text-ink ring-1 ring-border">{student?.course ?? 'Course unknown'}</span>
                <span className="rounded-full bg-surface px-3 py-1 text-sm text-ink ring-1 ring-border">{student?.college ?? 'College unknown'}</span>
                {student?.age != null && <span className="rounded-full bg-surface px-3 py-1 text-sm text-ink ring-1 ring-border">Age {student.age}</span>}
              </div>
              <p className="text-muted mt-1 text-sm">{student?.patient_code}</p>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted text-xs uppercase tracking-[0.2em]">Live latest reading</p>
                  <p className="text-ink font-medium mt-2">
                    {latestReadingStatusText}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  latestReading?.stress_level === 'stress'
                    ? 'bg-alert/15 text-alert'
                    : latestReading?.stress_level === 'mild_stress'
                    ? 'bg-mild/15 text-mild'
                    : 'bg-calm/15 text-calm'
                }`}>
                  {latestReadingLabel}
                </span>
              </div>
              <div className="text-sm text-muted mt-3">
                <p>{latestReading?.classified_at ? new Date(latestReading.classified_at).toLocaleString() : 'No timestamp'}</p>
                <p>Source: {latestReading?.source ?? 'unknown'}</p>
              </div>
              <div className="mt-5 h-36">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={history.slice(0, 10).reverse().map((h) => ({
                        ...h,
                        time: new Date(h.classified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        value: h.stress_level === 'stress' ? 3 : h.stress_level === 'mild_stress' ? 2 : 1,
                      }))}
                      margin={{ top: 4, right: 10, left: -10, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="liveStressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis
                        type="number"
                        domain={[1, 3]}
                        tickCount={3}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickFormatter={(value) => (value === 3 ? 'High' : value === 2 ? 'Mild' : 'Calm')}
                      />
                      <Tooltip
                        cursor={{ stroke: '#D1D5DB', strokeWidth: 1, opacity: 0.7 }}
                        formatter={(value: number) =>
                          value === 3 ? 'High stress' : value === 2 ? 'Mild stress' : 'Calm'
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#22C55E"
                        fill="url(#liveStressGradient)"
                        strokeWidth={2}
                        activeDot={{ r: 4, stroke: '#22C55E', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted text-sm">No live graph data yet.</div>
                )}
              </div>
            </div>
          </div>
          <div ref={noteFormRef} className="glass-card p-6">
            <p className="text-muted text-xs">Add Notes</p>
            <form onSubmit={handleAddNote} className="mt-4 flex flex-col gap-3">
              <textarea
                rows={10}
                className="field overflow-y-auto resize-none"
                style={{ minHeight: '12rem' }}
                placeholder="Observations from this session…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <textarea
                rows={5}
                className="field overflow-y-auto resize-none"
                placeholder="Recommendation (optional)"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
