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
        // ui.md breakpoints: xs < 600px (default), md 600-840px, lg 840-1200px
        'md': '600px',  // 600 <= width < 840 (md in ui.md)
        'lg': '840px',  // 840 <= width < 1200 (lg in ui.md)  
        'xl': '1200px', // 1200 <= width
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