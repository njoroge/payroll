/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get current mode (development, production)
const mode = process.env.NODE_ENV || 'development';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic' // Explicitly set to classic runtime
    })
  ],
  define: {
    // Define process.env as an object.
    // This helps if some library checks for process.env.SOMETHING.
    'process.env': {},
    // Specifically define NODE_ENV
    'process.env.NODE_ENV': JSON.stringify(mode),
    // If you rely on other VITE_ prefixed env variables, they are accessed via import.meta.env.VITE_YOUR_VAR
    // No need to define them here unless a library specifically looks for them on process.env
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
