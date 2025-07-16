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
        // Original theme colors
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'neutral': 'var(--color-neutral)',
        
        // Extended color palette
        'surface': 'var(--color-surface)',
        'surface-variant': 'var(--color-surface-variant)',
        'surface-dim': 'var(--color-surface-dim)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'outline': 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        
        // shadcn color system
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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