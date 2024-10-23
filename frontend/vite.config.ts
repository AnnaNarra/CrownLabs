import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  css: {
    preprocessorOptions: {
      less: {
        math: "always",
        realtiveUrls: true,
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1c7afd',
          '@secondary-color': '#FF7C11',
        }
      }
    }
  }
})
