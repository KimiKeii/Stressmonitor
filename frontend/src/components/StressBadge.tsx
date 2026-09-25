import { StressLevel } from '../api/client'

const CONFIG: Record<StressLevel, { label: string; color: string; ring: string }> = {
  non_stress: { label: 'Non-Stress', color: 'text-calm', ring: 'ring-calm/40' },
  mild_stress: { label: 'Mild Stress', color: 'text-mild', ring: 'ring-mild/40' },
  stress: { label: 'High Stress', color: 'text-alert', ring: 'ring-alert/40' },
}

export function StressBadge({ level, size = 'md' }: { level: StressLevel; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = CONFIG[level]
  const sizeClasses = size === 'lg' ? 'text-2xl px-5 py-2' : size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ring-1 ${cfg.ring} ${cfg.color} ${sizeClasses} font-display font-semibold bg-black/[0.03]`}
    >
      <span className={`w-2 h-2 rounded-full bg-current ${level === 'stress' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}
