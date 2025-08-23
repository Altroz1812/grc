import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '2.5rem',
      },
      screens: {
        '2xl': '1500px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(75, 55%, 35%)', // Slightly darker lemon green for focus rings
        background: 'hsl(0, 0%, 100%)', // Pure white
        foreground: 'hsl(200, 20%, 10%)',
        primary: {
          DEFAULT: 'hsl(75, 55%, 35%)', // Darker lemon green for vibrancy
          foreground: 'hsl(0, 0%, 100%)', // Pure white
        },
        secondary: {
          DEFAULT: 'hsl(200, 50%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 80%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        muted: {
          DEFAULT: 'hsl(200, 20%, 90%)',
          foreground: 'hsl(200, 30%, 30%)',
        },
        accent: {
          DEFAULT: 'hsl(75, 55%, 30%)', // Slightly darker lemon green for accents
          foreground: 'hsl(0, 0%, 100%)', // Pure white
        },
        popover: {
          DEFAULT: 'hsl(200, 20%, 94%)',
          foreground: 'hsl(200, 30%, 15%)',
          hover: 'hsl(75, 35%, 85%)', // Darker lemon green tinted hover
        },
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(200, 30%, 15%)',
        },
        sidebar: {
          DEFAULT: 'hsl(200, 50%, 15%)',
          foreground: 'hsl(0, 0%, 100%)', // Pure white
          primary: 'hsl(75, 55%, 35%)', // Darker lemon green for sidebar highlights
          'primary-foreground': 'hsl(0, 0%, 100%)',
          accent: 'hsl(260, 50%, 45%)',
          'accent-foreground': 'hsl(200, 30%, 15%)',
          border: 'hsl(200, 20%, 85%)',
          ring: 'hsl(75, 55%, 35%)',
        },
        chart: {
          '1': 'hsl(75, 55%, 35%)',
          '2': 'hsl(200, 50%, 45%)',
          '3': 'hsl(260, 50%, 45%)',
          '4': 'hsl(200, 30%, 50%)',
          '5': 'hsl(0, 80%, 45%)',
          '6': 'hsl(200, 20%, 90%)',
        },
      },
      // rest unchanged
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
        '.glassmorphism': {
          'backdrop-filter': 'blur(18px)',
          '-webkit-backdrop-filter': 'blur(18px)',
          'background': 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0))',
          'box-shadow': '0 12px 48px rgba(0, 0, 0, 0.18)',
          'border': '1px solid rgba(255, 255, 255, 0.35)',
        },
        '.focus-ring': {
          '@apply ring-2 ring-offset-2 ring-primary outline-none': {},
        },
        '.smooth-transition': {
          'transition': 'all 500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.hover-scale': {
          '@apply hover:animation-hover-scale': {},
        },
        '.popover-hover': {
          'background-color': 'hsl(75, 35%, 85%)',
          'transition': 'background-color 500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.glow': {
          '@apply animation-glow': {},
        },
      });
    },
  ],
} satisfies Config;
