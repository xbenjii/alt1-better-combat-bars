import copy from 'rollup-plugin-copy';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/alt1-better-combat-bars/' : '/',
  build: {
    outDir: 'dist',
  },
  plugins: [
    react(),
    copy({
      targets: [
        { src: './public/appconfig.json', dest: './dist' },
        { src: './public/homebutton.data.png', dest: './dist' },
        { src: './public/icon.png', dest: './dist' },
      ]
    })
  ],
})
