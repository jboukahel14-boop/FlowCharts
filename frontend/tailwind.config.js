/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#0f0f13',
          grid: '#1e1e2a',
        },
        node: {
          trigger: '#10b981',
          action: '#3b82f6',
          condition: '#f59e0b',
          border: '#2a2a3e',
          bg: '#16161f',
        },
        glass: {
          bg: 'rgba(22, 22, 31, 0.85)',
          border: 'rgba(255, 255, 255, 0.06)',
          glow: 'rgba(59, 130, 246, 0.15)',
        },
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59, 130, 246, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
