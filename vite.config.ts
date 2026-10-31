import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => 
{ import { VitePWA } from 
'vite-plugin-pwa'
  return { base: './', plugins: 
    [react(), tailwindcss()], 
    resolve: {
export default defineConfig({ 
        alias: { '@': 
        path.resolve(__dirname, 
        '.'),
  plugins: [ }, react(), }, 
    server: { VitePWA({ hmr: 
    process.env.DISABLE_HMR !== 
    'true',
      registerType: 'autoUpdate', 
      watch: 
      process.env.DISABLE_HMR === 
      'true' ? null : {}, 
      manifest: { },
        name: 'TaleemOS Pro', }; 
        short_name: 'TaleemOS',}); 
        description: 
        'Institutional Management 
        System', theme_color: 
        '#1e1b4b', // App ka theme 
        color (dark blue) 
        background_color: 
        '#ffffff', display: 
        'standalone', // Yeh isko 
        full-screen app banata hai 
        icons: [
          { src: '/icon.png', // 
            Yeh humne Step 1 mein 
            copy ki hai sizes: 
            '192x192', type: 
            'image/png', purpose: 
            'any maskable'
          },
          { src: '/icon.png', 
            sizes: '512x512', 
            type: 'image/png', 
            purpose: 'any 
            maskable'
          }
        ]
      }
    })
  ]
})
