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
      entry: {
        index: './src/index.ts',
        vite: './src/vite.ts'
      },
      name: 'Vue3StreamBubble',
      fileName: (format, entryName) => `${entryName}.mjs`,
      formats: ['es']
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
