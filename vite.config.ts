import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `vite build --mode demo` builds demo.html (no login, sample data) as one script, for previews.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build:
    mode === 'demo'
      ? { outDir: 'dist-demo', rollupOptions: { input: 'demo.html', output: { inlineDynamicImports: true } } }
      : { chunkSizeWarningLimit: 800 },
}))
