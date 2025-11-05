import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/test-db': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/test-insert': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/test-clean': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
        historyApiFallback: true, // ← Important pour le routing côté client
    },
});