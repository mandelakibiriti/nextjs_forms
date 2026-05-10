import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.ts',
      name: 'FormForge',
      formats: ['iife', 'es'],
      fileName: (format) => (format === 'iife' ? 'embed.js' : 'embed.esm.js'),
    },
    rollupOptions: {
      output: {
        // IIFE format: FormForge global exposed on window
        name: 'FormForge',
      },
    },
  },
})
