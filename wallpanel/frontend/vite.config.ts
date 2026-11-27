import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' -> rutas relativas, necesario para funcionar detrás del ingress de Home Assistant.
// "--mode preview" genera un único HTML autónomo (modo demo) para vista previa.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'preview' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'preview' ? 'dist-preview' : 'dist' },
  server: { proxy: { '/api': 'http://localhost:8099', '/ws': { target: 'ws://localhost:8099', ws: true } } },
}));
