import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base '/' : le site est servi à la racine du domaine personnalisé paul-signe.fr
export default defineConfig({ plugins: [react(), tailwindcss()], base: '/' });
