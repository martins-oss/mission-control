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
        background: {
          primary: '#0A0A0A',
          secondary: '#141414',
        },
        accent: {
          primary: '#34D399',
          muted: 'rgba(52, 211, 153, 0.15)',
        },
      },
    },
  },
  plugins: [],
}
export default config
