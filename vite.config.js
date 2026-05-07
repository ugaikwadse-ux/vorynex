import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Get all .html files in the root directory
const rootFiles = readdirSync('./').filter(file => file.endsWith('.html'));
const input = {};
rootFiles.forEach(file => {
  const name = file.replace('.html', '');
  input[name] = resolve(__dirname, file);
});

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input
    }
  }
});
