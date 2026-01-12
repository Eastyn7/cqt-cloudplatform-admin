import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

// 读取自动导入的全局变量配置
// 使用同步方式读取，如果文件不存在则使用空对象
let autoImportGlobals = {}
try {
  const autoImportFile = fileURLToPath(new URL('./src/.eslintrc-auto-import.json', import.meta.url))
  const autoImportContent = readFileSync(autoImportFile, 'utf-8')
  const autoImportConfig = JSON.parse(autoImportContent)
  autoImportGlobals = autoImportConfig.globals || {}
} catch (error) {
  // 如果文件不存在，使用空对象（首次运行或文件未生成时）
  // 这是正常的，文件会在首次运行 dev 服务器时生成
  // 文件路径：src/.eslintrc-auto-import.json
}

export default defineConfigWithVueTs(
  // 配置自动导入的全局变量
  {
    languageOptions: {
      globals: {
        ...autoImportGlobals,
      },
    },
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  // 忽略构建产物和自动生成的文件
  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/auto-imports.d.ts',
    '**/components.d.ts',
    'src/auto-imports.d.ts', // 忽略自动生成的类型声明文件
    'src/components.d.ts', // 忽略自动生成的组件类型声明文件
    'src/.eslintrc-auto-import.json', // 忽略自动生成的 ESLint 配置文件
    '**/node_modules/**',
  ]),

  // Vue 3 推荐配置
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  // 自定义规则
  {
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off', // 允许单单词组件名
      'vue/no-v-html': 'warn', // v-html 使用警告
      
      // TypeScript 相关规则
      '@typescript-eslint/no-explicit-any': 'warn', // any 类型使用警告而非错误
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-nocheck': 'allow-with-description', // 允许使用 @ts-nocheck，但需要说明原因
        },
      ], // 允许使用 TypeScript 注释
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ], // 未使用变量警告，允许以下划线开头

      // 通用规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 生产环境禁止 console
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产环境禁止 debugger
    },
  },
)
