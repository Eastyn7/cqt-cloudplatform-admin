# Axios 请求封装说明

## 文件结构

```
src/utils/request/
├── index.ts    # Axios 实例和拦截器配置
├── types.ts    # TypeScript 类型定义
└── README.md   # 使用说明
```

## 功能特性

1. **自动添加 Token**：请求拦截器自动从 localStorage 或 sessionStorage 获取 token 并添加到请求头
2. **统一错误处理**：响应拦截器统一处理业务错误和 HTTP 错误
3. **自动提示**：支持自动显示成功/错误提示（可配置）
4. **类型安全**：完整的 TypeScript 类型支持

## 使用方法

### 基础使用

```typescript
import { request } from '@/utils/request'

// GET 请求
const response = await request.get('/user/info')
console.log(response.data) // 获取数据

// POST 请求
const result = await request.post('/user/update', {
  name: '张三',
  age: 25,
})
```

### 配置选项

```typescript
// 不显示错误提示
await request.get('/api/data', {
  showError: false,
})

// 显示成功提示
await request.post('/api/create', data, {
  showSuccess: true,
})

// 跳过 token 验证
await request.get('/api/public', {
  skipAuth: true,
})
```

### 在 API 文件中使用

```typescript
// src/utils/api/user.ts
import { request } from '../request'

export const userApi = {
  getUserInfo: () => request.get<UserInfo>('/user/info'),

  updateUserInfo: (data: UpdateUserDto) =>
    request.post('/user/update', data, { showSuccess: true }),
}
```

## 环境变量配置

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 响应数据结构

后端接口返回格式（根据后端接口文档规范）：

```typescript
{
  code: number                    // HTTP 状态码（如 200 / 400 / 401 / 500）
  success: boolean                // 是否成功（code 在 2xx 范围内即为成功）
  message: string                 // 操作结果说明（如成功、错误原因等）
  data: T | null                  // 实际业务数据内容，可为空
  meta?: Record<string, unknown> | null  // 附加元数据（分页信息、统计信息等，可选）
  debug?: Record<string, unknown> | null // 开发模式下返回的调试信息（可选）
}
```

## 状态码处理

根据后端规范，支持以下状态码：

| 状态码 | 说明                   | 处理方式                |
| ------ | ---------------------- | ----------------------- |
| 200    | 请求成功               | 正常返回数据            |
| 201    | 创建成功               | 正常返回数据            |
| 400    | 参数错误               | 显示错误提示            |
| 401    | 未登录 / Token 失效    | 清除 token 并跳转登录页 |
| 403    | 权限不足               | 显示无权限提示          |
| 404    | 资源不存在             | 显示错误提示            |
| 409    | 数据冲突（如邮箱重复） | 显示错误提示            |
| 500    | 内部服务器错误         | 显示错误提示            |
| 503    | 服务不可用             | 显示错误提示            |

## 错误处理

- **401 未授权**：自动清除 token 并弹出确认框，用户确认后跳转登录页
- **400/403/404/409/500/503**：显示对应的错误提示信息
- **网络错误**：显示"网络连接失败，请检查网络"提示
- **其他错误**：显示错误提示信息

## 成功判断

根据后端规范，成功判断标准：

- `success === true` 或
- `code >= 200 && code < 300`（code 在 2xx 范围内）

## 注意事项

1. **Token 存储**：默认从 `localStorage.getItem('token')` 获取
2. **Token 格式**：请求头格式为 `Authorization: Bearer <token>`
3. **登录跳转**：401 错误时会弹出确认框，用户确认后跳转到 `/login`
4. **跳过鉴权**：对于公开接口（如 `/public/**`），可使用 `skipAuth: true` 跳过 token 验证
5. **元数据访问**：响应中包含 `meta` 字段时，可通过 `response.meta` 访问分页等信息
6. **调试信息**：开发环境下，响应可能包含 `debug` 字段，可用于调试
