import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      // 指定包含的文件类型
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      // 自动导入 Vue 相关 API
      imports: [
        'vue',
        'vue-router',
        'pinia',
        // 手动配置 Element Plus API 自动导入
        {
          'element-plus': [
            'ElMessage',
            'ElMessageBox',
            'ElNotification',
            'ElLoading',
          ],
        },
      ],
      // 生成 TypeScript 类型声明文件到 src 目录
      dts: 'src/auto-imports.d.ts',
      resolvers: [
        ElementPlusResolver({
          // 自动导入 Element Plus 的 API（如 ElMessage、ElMessageBox 等）
          importStyle: false, // 样式已经在 main.ts 中全局导入
        }),
      ],
      // ESLint 配置
      eslintrc: {
        enabled: true, // 启用 ESLint 配置文件生成
        filepath: 'src/.eslintrc-auto-import.json', // 生成到 src 目录下
        globalsPropValue: true, // 生成全局变量配置
      },
    }),
    Components({
      // 搜索子目录
      deep: true,
      // 组件有效的扩展名
      extensions: ['vue', 'js', 'jsx', 'ts', 'tsx', '.mjs'],
      // 指定包含的文件
      include: [/\.vue$/, /\.vue\?vue/, /\.js$/, /\.jsx$/, /\.ts$/, /\.tsx$/],
      resolvers: [
        ElementPlusResolver({
          // 自动导入 Element Plus 组件
          importStyle: false, // 样式已经在 main.ts 中全局导入
        }),
      ],
      // 指定组件目录
      dirs: ['src/components'],
      // 生成类型声明文件到 src 目录
      dts: 'src/components.d.ts',
      // 启用指令自动导入
      directives: true,
    }),
  ],
  // 基础路径
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 开发服务器配置
  server: {
    port: 18080,
  },
})
