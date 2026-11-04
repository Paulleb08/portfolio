import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base relative : le même build marche sur paul-signe.fr/ et sur paulleb08.github.io/portfolio/ (pas de routeur, donc sans risque)
export default defineConfig({ plugins: [react(), tailwindcss()], base: './' });
