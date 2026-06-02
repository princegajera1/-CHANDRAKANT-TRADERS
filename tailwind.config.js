/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        'accent-gold': 'var(--accent-gold)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        glass: 'var(--glass)',
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.25)',
        'glow-gold': '0 0 20px rgba(255, 184, 0, 0.25)',
        'glow-green': '0 0 20px rgba(0, 230, 118, 0.25)',
        'glow-red': '0 0 20px rgba(255, 61, 87, 0.25)',
      }
    },
  },
  plugins: [],
}
