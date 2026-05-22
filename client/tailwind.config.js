/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f5ff',
          purple: '#bf00ff',
          green: '#00ff88',
          pink: '#ff3366',
          orange: '#ff8800',
          yellow: '#ffd700'
        },
        dark: {
          950: '#02020f',
          900: '#050510',
          850: '#080820',
          800: '#0d0d25',
          700: '#12123a',
          600: '#1a1a4e'
        }
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'body': ['Rajdhani', 'sans-serif'],
        'mono': ['Share Tech Mono', 'monospace']
      },
      boxShadow: {
        'neon-blue': '0 0 20px #00f5ff, 0 0 40px #00f5ff44',
        'neon-purple': '0 0 20px #bf00ff, 0 0 40px #bf00ff44',
        'neon-green': '0 0 20px #00ff88, 0 0 40px #00ff8844',
        'neon-pink': '0 0 20px #ff3366, 0 0 40px #ff336644',
        'glass': '0 8px 32px rgba(0, 245, 255, 0.1)',
        'glass-lg': '0 16px 64px rgba(0, 245, 255, 0.15)'
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'flicker': 'flicker 0.15s infinite linear',
        'matrix': 'matrix 20s linear infinite',
        'grid-move': 'gridMove 20s linear infinite',
        'border-spin': 'borderSpin 3s linear infinite'
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' }
        },
        borderSpin: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
