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
        xl: '2rem',
        '2xl': '2rem',
      },
      screens: {
        '2xl': '1500px',
      },
    },
    extend: {
      // Enhanced font families with fallbacks
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // HSL-based dynamic colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Extended primary color palette
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
          hover: 'hsl(75, 35%, 85%)',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Construction colors
        construction: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAD7FB',
          300: '#90BBF5',
          400: '#619AEC',
          500: '#3F76D4',
          600: '#2C56B0',
          700: '#1F408D',
          800: '#15306D',
          900: '#0E2144',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Chart colors
        chart: {
          '1': 'hsl(75, 55%, 35%)',
          '2': 'hsl(200, 50%, 45%)',
          '3': 'hsl(260, 50%, 45%)',
          '4': 'hsl(200, 30%, 50%)',
          '5': 'hsl(0, 80%, 45%)',
          '6': 'hsl(200, 20%, 90%)',
        },
      },
      // Enhanced border radius with CSS variables
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Improved typography scale with better line heights
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      // Extended spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Enhanced keyframes and animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(66, 153, 225, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(66, 153, 225, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      // Backdrop blur utilities
      backdropBlur: {
        xs: '2px',
      },
      // Enhanced box shadows
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
        'medium': '0 6px 20px rgba(0, 0, 0, 0.12)',
        'large': '0 10px 38px rgba(0, 0, 0, 0.15)',
        'xl-soft': '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom utilities plugin
    function ({ addUtilities, addComponents }) {
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
          '@apply hover:animate-hover-scale': {},
        },
        '.popover-hover': {
          'background-color': 'hsl(75, 35%, 85%)',
          'transition': 'background-color 500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.glow': {
          '@apply animate-glow': {},
        },
        // Text balance for better readability
        '.text-balance': {
          'text-wrap': 'balance',
        },
        // Improved scrollbar styling
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-rounded::-webkit-scrollbar-thumb': {
          'border-radius': '0.5rem',
        },
      });

      // Component examples
      addComponents({
        '.btn-primary': {
          'backgroundColor': 'hsl(var(--primary))',
          'color': 'hsl(var(--primary-foreground))',
          'padding': '0.75rem 1.5rem',
          'borderRadius': '0.375rem',
          'fontWeight': '600',
          'transition': 'all 200ms',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'boxShadow': '0 6px 20px rgba(0, 0, 0, 0.12)',
          },
        },
        '.card': {
          'backgroundColor': 'hsl(var(--card))',
          'color': 'hsl(var(--card-foreground))',
          'borderRadius': '0.5rem',
          'boxShadow': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
          'padding': '1.5rem',
          'transition': 'box-shadow 200ms',
          '&:hover': {
            'boxShadow': '0 10px 38px rgba(0, 0, 0, 0.15)',
          },
        },
      });
    },
  ],
} satisfies Config;