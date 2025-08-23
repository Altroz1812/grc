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
      // Merged padding: using the more detailed structure from the first config,
      // but ensuring a default of '2rem' for wider screens consistent with the second.
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '2.5rem',
        xl: '2rem', // Added for consistency with '2xl' below if not explicitly defined
        '2xl': '2rem', // Adjusted to '2rem' as a common responsive breakpoint
      },
      screens: {
        // Taking the larger 2xl breakpoint from the first config
        '2xl': '1500px',
      },
    },
    extend: {
      // Font families from the second config
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Prioritizing hsl(var(--*)) for dynamic theming where available
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))', // This will be dynamic from CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
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
          hover: 'hsl(75, 35%, 85%)', // Unique to first config
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Unique construction colors from the second config
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
          DEFAULT: 'hsl(var(--sidebar-background))', // Using var() for consistency
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Unique chart colors from the first config
        chart: {
          '1': 'hsl(75, 55%, 35%)',
          '2': 'hsl(200, 50%, 45%)',
          '3': 'hsl(260, 50%, 45%)',
          '4': 'hsl(200, 30%, 50%)',
          '5': 'hsl(0, 80%, 45%)',
          '6': 'hsl(200, 20%, 90%)',
        },
      },
      // Border radius from the second config
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Keyframes from the second config
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
        // Placeholder for a glow animation if it were defined in keyframes for '.glow' utility
        'glow-animation': {
          '0%, 100%': { 'box-shadow': '0 0 5px rgba(118, 185, 0, 0.5)' }, // Example glow color
          '50%': { 'box-shadow': '0 0 20px rgba(118, 185, 0, 0.8)' },
        },
        // Placeholder for a hover-scale animation if it were defined in keyframes for '.hover-scale' utility
        'hover-scale-animation': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' }, // Example scale
        }
      },
      // Animations from the second config, extended with placeholders for first config's utilities
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'glow': 'glow-animation 1.5s infinite alternate ease-in-out', // Added for '.glow' utility
        'hover-scale': 'hover-scale-animation 0.3s ease-in-out forwards', // Added for '.hover-scale' utility
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom utilities from the first config
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
          // This uses 'ring-primary' from the merged color palette
          '@apply ring-2 ring-offset-2 ring-primary outline-none': {},
        },
        '.smooth-transition': {
          'transition': 'all 500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        // These utilities now reference the animations defined in the `extend.animation` section
        '.hover-scale': {
          '@apply hover:animate-hover-scale': {}, // Use animate-* to reference keyframes
        },
        '.popover-hover': {
          'background-color': 'hsl(75, 35%, 85%)', // Explicit color, but could be refactored to use var()
          'transition': 'background-color 500ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.glow': {
          '@apply animate-glow': {}, // Use animate-* to reference keyframes
        },
      });
    },
  ],
} satisfies Config;
