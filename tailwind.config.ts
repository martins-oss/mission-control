import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Arcade palette
        arcade: {
          black: '#0A0A0F',
          surface: '#111118',
          border: '#1A1A24',
        },
        neon: {
          green: '#39FF14',
          pink: '#FF2D7B',
          blue: '#00D4FF',
          amber: '#FFB800',
          purple: '#B24BF3',
        },
        // Agent colors
        agent: {
          iris: '#B24BF3',
          max: '#FFB800',
          dash: '#FF2D7B',
          atlas: '#00D4FF',
          amber: '#39FF14',
          pixel: '#FF6B6B', // fallback for gradient
        },
        // Legacy compat
        accent: '#39FF14',
        surface: {
          base: '#0A0A0F',
          raised: '#111118',
          overlay: '#1A1A24',
        },
      },
      fontFamily: {
        arcade: ['var(--font-arcade)', 'monospace'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-mono)', 'system-ui', 'sans-serif'],
        display: ['var(--font-arcade)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'boot': 'bootUp 0.6s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scanline': 'scanlineMove 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'count-up': 'countUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bootUp: {
          '0%': { opacity: '0', filter: 'brightness(3)' },
          '30%': { opacity: '1', filter: 'brightness(1.5)' },
          '100%': { opacity: '1', filter: 'brightness(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scanlineMove: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100vh)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.1)',
        'neon-pink': '0 0 20px rgba(255, 45, 123, 0.3), 0 0 40px rgba(255, 45, 123, 0.1)',
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)',
        'neon-amber': '0 0 20px rgba(255, 184, 0, 0.3), 0 0 40px rgba(255, 184, 0, 0.1)',
        'neon-purple': '0 0 20px rgba(178, 75, 243, 0.3), 0 0 40px rgba(178, 75, 243, 0.1)',
      },
    },
  },
  plugins: [],
}
export default config
