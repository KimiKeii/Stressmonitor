/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F4F3FA',        // soft lavender-mist background — airy, not clinical, not cream
        surface: '#FFFFFF',     // clean white cards, lifted with shadow instead of a glass border
        border: 'rgba(43,37,52,0.08)',
        borderStrong: 'rgba(43,37,52,0.14)',
        muted: '#6F6684',        // soft graphite-lavender for secondary text
        ink: '#2B2534',          // soft near-black plum — primary text, gentler than pure black
        accent: '#3FAFA8',       // fresh teal — buttons, links, focus, idle/brand states
        calm: '#34B57F',         // clear mint-green — non-stress
        mild: '#EFA53C',         // warm honey-amber — mild stress
        alert: '#F16B62',        // soft coral-red — high stress, urgent without being harsh
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
