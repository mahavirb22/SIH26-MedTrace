/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#faf9f5',
          dim: '#dbdad6',
          bright: '#faf9f5',
          variant: '#e3e2df',
          container: {
            lowest: '#ffffff',
            low: '#f4f4f0',
            DEFAULT: '#efeeea',
            high: '#e9e8e4',
            highest: '#e3e2df',
          },
          tint: '#406659',
        },
        'on-surface': {
          DEFAULT: '#1b1c1a',
          variant: '#414845',
        },
        'inverse-surface': '#2f312e',
        'inverse-on-surface': '#f2f1ed',
        outline: {
          DEFAULT: '#717975',
          variant: '#c1c8c4',
        },
        primary: {
          DEFAULT: '#00261c',
          container: '#163c31',
          fixed: '#c2ebdb',
          'fixed-dim': '#a7cfc0',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#80a798',
          fixed: '#002118',
          'fixed-variant': '#284e42',
        },
        'inverse-primary': '#a7cfc0',
        secondary: {
          DEFAULT: '#506600',
          container: '#c8f248',
          fixed: '#c8f248',
          'fixed-dim': '#add52b',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#556d00',
          fixed: '#161f00',
          'fixed-variant': '#3c4d00',
        },
        tertiary: {
          DEFAULT: '#15231e',
          container: '#2a3933',
          fixed: '#d6e6dd',
          'fixed-dim': '#bacac1',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#92a29a',
          fixed: '#101e19',
          'fixed-variant': '#3b4a43',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        background: '#faf9f5',
        'on-background': '#1b1c1a',
        brand: {
          primary: '#163C31',
          cta: '#C8F248',
          bg: '#FAF9F5',
          neutral: '#7C8C84',
          text: '#14231D',
        },
      },
      fontFamily: {
        headline: ['Syne', 'sans-serif'],
        body: ['Hanken Grotesk', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
        syne: ['Syne', 'sans-serif'],
        hanken: ['Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        base: '8px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '64px',
      },
      maxWidth: {
        'content': '1200px',
      },
      boxShadow: {
        'level-0': 'none',
        'level-1': 'none',
        'level-2': '0px 4px 20px rgba(22, 60, 49, 0.05)',
      },
    },
  },
  plugins: [],
};
