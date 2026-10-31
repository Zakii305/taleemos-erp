import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Yeh line file size ki limit barha degi (5 MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },
      manifest: {
        name: 'TaleemOS Pro',
        short_name: 'TaleemOS',
        description: 'Institutional Management System',
        theme_color: '#1e1b4b',
        background_color: '#ffffff',
        icons: [
          { src: '/icon.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
