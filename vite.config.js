import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Pubblicata su GitHub Pages in un sottopercorso (ragnarokko.github.io/wh40-tool/): senza base i
// file statici non verrebbero trovati. In sviluppo (npm run dev) resta '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wh40-tool/' : '/',
  plugins: [react()],
}))
