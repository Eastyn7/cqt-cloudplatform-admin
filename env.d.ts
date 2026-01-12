/// <reference types="vite/client" />
/// <reference types="./auto-imports.d.ts" />

import type { useDate } from './src/utils/date'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// Vue 全局属性类型声明
declare module 'vue' {
  interface ComponentCustomProperties {
    $date: typeof useDate
  }
}

// Vite 已经内置了图片类型声明，但为了确保类型检查，这里显式声明
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
