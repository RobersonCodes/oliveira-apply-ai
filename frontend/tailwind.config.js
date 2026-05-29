/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          primary:   '#0f0f19',
          secondary: '#13131f',
          tertiary:  '#1a1a2e',
        },
        text: {
          primary:   '#f8fafc',
          secondary: '#cbd5e1',
          muted:     '#64748b',
        },
        border: {
          primary: 'rgba(255,255,255,0.08)',
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.5s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'shimmer':   'shimmer 2s linear infinite',
        'float':     'float 6s ease-in-out infinite',
        'glow':      'glow 2s ease-in-out infinite',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        glow:    { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        'grid-pattern':   'linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)',
        'dot-pattern':    'radial-gradient(rgba(99,102,241,0.15) 1px,transparent 1px)',
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99,102,241,0.3)',
        'glow-lg':    '0 0 40px rgba(99,102,241,0.2)',
        'glass':      '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
