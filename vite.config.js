import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isMobile = process.env.VITE_APP_PLATFORM === 'android';
  return {
    plugins: [react()],
    base: isMobile ? './' : (command === 'serve' ? '/' : '/chess-playground/'),
  };
})
