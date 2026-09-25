import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function AddStudent() {
  const navigate = useNavigate()
  const [course, setCourse] = useState('')
  const [college, setCollege] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!course.trim() || !college.trim() || !age.trim()) {
      setError('All fields are required.')
      return
    }

    setSaving(true)
    try {
      await api.post('/students', {
        course,
        college,
        age: Number(age),
      })
      navigate('/counselor')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create student. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 max-w-md mx-auto">
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-muted text-xs uppercase tracking-[0.2em]">Add student</p>
          <h1 className="font-display text-2xl mt-3">Create a new student profile</h1>
          <p className="text-muted mt-2 text-sm">Only course, college, and age are collected for privacy; the patient code is generated automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Course</label>
            <input className="field" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Psychology" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">College</label>
            <input className="field" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Education" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Age</label>
            <input className="field" type="number" min={10} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" required />
          </div>


          {error && <p className="text-alert text-sm">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Creating…' : 'Create student'}
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={() => navigate('/counselor')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
