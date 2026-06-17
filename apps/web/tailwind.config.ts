import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
        },
        surface: {
          DEFAULT: '#0F0F1A',
          elevated: '#1A1A2E',
          card: '#141420',
        },
        positive: '#10B981',
        negative: '#EF4444',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        countUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};

export default config;
