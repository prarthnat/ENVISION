/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0F172A',
          card: '#1E293B',
          raised: '#334155',
          border: '#1E293B',
          muted: '#475569',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          muted: '#6366F120',
        },
        status: {
          active: '#6366F1',
          completed: '#10B981',
          onhold: '#F59E0B',
          pending: '#64748B',
          inprogress: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 6, 23, 0.45)',
      },
    },
  },
  plugins: [],
};
