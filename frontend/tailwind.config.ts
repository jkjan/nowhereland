import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'light-primary': '#f1f0ed',
        'light-secondary': '#2D2926',
        'light-accent': '#D01C1F',
        // Dark theme colors
        'dark-primary': '#2D2926',
        'dark-secondary': '#f1f0ed',
        'dark-accent': '#FF8200',
        // Neutral color
        'neutral': '#A7A8AA',
        // Semantic color variables (will be set by theme)
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        '7xl': '1280px',
      },
      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '4': 'repeat(4, minmax(0, 1fr))',
      },
      borderRadius: {
        'theme': 'var(--border-radius)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config