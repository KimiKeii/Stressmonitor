import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, StudentUser } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { StressBadge } from '../../components/StressBadge'

export default function CounselorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<StudentUser[]>([])

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data))
  }, [])

  const totalStudents = students.length
  const alertCount = students.filter((s) => s.stress_classifications?.[0]?.stress_level === 'stress').length
  const mildCount = students.filter((s) => s.stress_classifications?.[0]?.stress_level === 'mild_stress').length
  const calmCount = students.filter((s) => s.stress_classifications?.[0]?.stress_level === 'non_stress').length
  const noDataCount = students.filter((s) => !s.stress_classifications?.length).length

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Good day, Counselor</h1>
          <p className="text-muted mt-2">Your current student caseload and stress overview.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            className="btn-ghost btn-sm"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            Log out
          </button>
          <button
            className="btn-primary btn-sm"
            onClick={() => navigate('/counselor/students/new')}
          >
            Add student
          </button>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl bg-surface border border-border p-4">
            <p className="text-muted text-xs">Students</p>
            <p className="font-display text-2xl mt-3">{totalStudents}</p>
          </div>
          <div className="rounded-3xl bg-surface border border-border p-4">
            <p className="text-muted text-xs">High alerts</p>
            <p className="font-display text-2xl mt-3">{alertCount}</p>
          </div>
          <div className="rounded-3xl bg-surface border border-border p-4">
            <p className="text-muted text-xs">Mild alerts</p>
            <p className="font-display text-2xl mt-3">{mildCount}</p>
          </div>
          <div className="rounded-3xl bg-surface border border-border p-4">
            <p className="text-muted text-xs">No reading</p>
            <p className="font-display text-2xl mt-3">{noDataCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {students.map((s) => {
          const latest = s.stress_classifications?.[0]
          const edgeColor =
            latest?.stress_level === 'stress' ? 'bg-alert' : latest?.stress_level === 'mild_stress' ? 'bg-mild' : 'bg-calm'
          const initials = (s.name || s.course || s.patient_code || 'Student')
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

          return (
            <Link
              key={s.id}
              to={`/counselor/students/${s.id}`}
              className="glass-card p-0 flex items-stretch justify-between overflow-hidden hover:border-borderStrong transition-colors"
            >
              <span className={`w-1 shrink-0 ${latest ? edgeColor : 'bg-black/10'}`} />
              <div className="flex items-center gap-3 py-3 px-4 flex-1">
                <span className="w-9 h-9 shrink-0 rounded-full bg-black/[0.03] ring-1 ring-border flex items-center justify-center text-xs font-display font-semibold text-muted">
                  {s.course?.charAt(0).toUpperCase() ?? 'S'}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.course ?? 'Student'}</p>
                  <p className="text-muted text-xs">{s.college ?? s.patient_code}</p>
                </div>
              </div>
              <div className="flex items-center pr-4">
                {latest ? <StressBadge level={latest.stress_level} size="sm" /> : (
                  <span className="text-muted text-xs">No data</span>
                )}
              </div>
            </Link>
          )
        })}

        {students.length === 0 && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-ink mb-1">No students yet</p>
            <p className="text-muted text-xs">Students will appear here once they pair a wristband.</p>
          </div>
        )}
      </div>
    </div>
  )
}
