import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    setSubmitting(true)
    try {
      const user = await login(email, password)
      navigate('/counselor')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md glass-card p-6 sm:p-8">
        <button className="text-sm text-muted mb-3 hover:text-ink" onClick={() => navigate('/')}>
          ← Back
        </button>
        <p className="text-xs uppercase tracking-wide text-muted mb-1">Guidance Counselor</p>
        <h1 className="font-display text-xl mb-6">Log in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="field"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {error && <p className="text-alert text-sm">{error}</p>}

          <button type="submit" className="btn-primary mt-2" disabled={submitting}>
            {submitting ? 'Please wait…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
