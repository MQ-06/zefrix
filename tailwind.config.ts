import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B9D',
          dark: '#E91E63',
        },
        secondary: {
          DEFAULT: '#FFA500',
          dark: '#FF8C00',
        },
        dark: {
          DEFAULT: '#1A1A2E',
          light: '#2D2D44',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1A1A2E 0%, #E91E63 100%)',
        'gradient-purple': 'linear-gradient(135deg, #1A1A2E 0%, #E91E63 50%, #FF6B9D 100%)',
      },
    },
  },
  plugins: [],
}
export default config

