import { useNavigate } from 'react-router-dom'
import { PulseRing } from '../../components/PulseRing'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(63,175,168,0.14), transparent 70%)',
          animation: 'drift 9s ease-in-out infinite',
        }}
      />

      <div className="w-full max-w-sm glass-card p-8 text-center relative">
        <PulseRing level={null} size={88} />

        <h1 className="font-display text-2xl sm:text-3xl mt-5 mb-1 tracking-tight">Stress Monitor</h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          Continuous, sensor-based stress detection for academic counseling.
        </p>

        <div className="flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Log in
          </button>
        </div>
      </div>
    </div>
  )
}
