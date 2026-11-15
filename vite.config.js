import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Pubblicata su GitHub Pages in un sottopercorso (ragnarokko.github.io/wh40k_tools/): senza base i
// file statici non verrebbero trovati. In sviluppo (npm run dev) resta '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wh40k_tools/' : '/',
  plugins: [react()],
}))
