import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import process from 'process';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
  },
});
