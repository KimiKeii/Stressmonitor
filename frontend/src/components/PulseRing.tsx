import { StressLevel } from '../api/client'

const DURATION: Record<StressLevel, string> = {
  non_stress: '4.2s',
  mild_stress: '2.4s',
  stress: '1.1s',
}

const COLOR: Record<StressLevel, string> = {
  non_stress: '#34B57F',
  mild_stress: '#EFA53C',
  stress: '#F16B62',
}

const IDLE_COLOR = '#3FAFA8' // brand teal — used when there's no reading yet, never implies "calm"

/**
 * A concentric "breathing" ring that stands in for a live heart-rate signal.
 * Speed and color follow the latest classification, so the shape itself carries
 * meaning instead of decorating a number — slow and sage at rest, quick and
 * brick-red under load. With no reading yet, it breathes slowly in the brand
 * teal rather than borrowing the "non-stress" color, so an empty state can
 * never be mistaken for a real "you're calm" result.
 */
export function PulseRing({ level, size = 132 }: { level: StressLevel | null; size?: number }) {
  const duration = level ? DURATION[level] : '5s'
  const color = level ? COLOR[level] : IDLE_COLOR

  return (
    <div
      className="relative mx-auto flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${color}`, opacity: 0.25, animation: `breathe ${duration} ease-in-out infinite` }}
      />
      <span
        className="absolute rounded-full"
        style={{
          inset: size * 0.14,
          border: `1px solid ${color}`,
          opacity: 0.45,
          animation: `breathe ${duration} ease-in-out infinite`,
          animationDelay: '-0.35s',
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          inset: size * 0.3,
          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        }}
      />
      <span
        className="rounded-full"
        style={{ width: size * 0.13, height: size * 0.13, background: color, boxShadow: `0 0 20px 2px ${color}99` }}
      />
    </div>
  )
}
