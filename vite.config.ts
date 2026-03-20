import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.spec.ts']
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Vue3StreamBubble',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'umd.js'}`,
      formats: ['es', 'umd']
    },
    cssCodeSplit: true, // 提取 CSS 到单独文件
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
