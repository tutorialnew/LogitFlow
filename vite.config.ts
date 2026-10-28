import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BASE_PATH: имя репозитория. GitHub Pages отдаёт проект по адресу
// https://<user>.github.io/<repo>/ — это нужно учесть в base, иначе
// ассеты не найдутся. Меняется одной строкой при переименовании репозитория.
export const BASE_PATH = '/LogitFlow/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // charts — Recharts и d3: они весят больше всего и грузятся отдельным запросом.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor'
          if (/node_modules\/(recharts|d3-|victory-|react-smooth)/.test(id)) return 'charts'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})