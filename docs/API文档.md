# Vela — API 文档

> 文档目的：记录所有 HTTP API Route 契约，供前端联调和后续维护使用。  
> 更新原则：任何 API 的新增/修改/删除，必须同步更新本文档。  
> 适用范围：`src/app/api/**/route.ts`

---

## 统一约定

### 鉴权

- 后台管理相关 API 必须要求登录态（Auth.js Session）
- 未登录时返回 `401 Unauthorized`

### 响应结构

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": "错误信息" }
```

### 状态码约定

- `200`：请求成功
- `400`：请求参数错误 / 业务校验失败
- `401`：未授权（未登录）
- `500`：服务端错误

---

## API 列表

### 1) 上传文件

- **Method**: `POST`
- **Path**: `/api/upload`
- **Auth**: 需要登录（后台用户）
- **Content-Type**: `multipart/form-data`

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | `File` | 是 | 上传文件 |
| `alt` | `string` | 否 | 图片替代文本 |

#### 校验规则

- 文件类型：
  - 图片：`image/jpeg`、`image/png`、`image/webp`、`image/gif`、`image/svg+xml`
  - 附件：`application/pdf`、`application/msword`、`application/vnd.openxmlformats-officedocument.wordprocessingml.document`、`application/vnd.ms-excel`、`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`、`text/plain`
- 文件大小：最大 10MB
- 栅格图（jpeg/png/webp）会转 WebP 并生成多尺寸变体；文档类附件按原格式存储

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "id": "9f3d1c8e-7782-4dd7-8ab5-67f31eabf111",
    "filename": "uploads/2026/03/uuid/original.webp",
    "originalName": "factory.jpg",
    "mimeType": "image/webp",
    "size": 182736,
    "width": 1920,
    "height": 1080,
    "alt": "工厂外景",
    "createdAt": "2026-03-07T10:10:00.000Z",
    "url": "/uploads/2026/03/uuid/original.webp",
    "variants": {
      "thumbnail": "/uploads/2026/03/uuid/thumbnail.webp",
      "small": "/uploads/2026/03/uuid/small.webp",
      "medium": "/uploads/2026/03/uuid/medium.webp",
      "large": "/uploads/2026/03/uuid/large.webp"
    }
  }
}
```

#### 失败响应示例

```json
{ "success": false, "error": "Unauthorized" }
```

```json
{ "success": false, "error": "File is required" }
```

```json
{ "success": false, "error": "Unsupported file type" }
```

---

### 2) 认证相关（Auth.js）

- **Path 前缀**: `/api/auth/*`
- **实现**: Auth.js handlers（`src/app/api/auth/[...nextauth]/route.ts`）
- **说明**: 由 Auth.js 内置路由处理，具体端点与参数遵循 Auth.js 规范

当前项目使用：

- 登录页：`/admin/login`
- 登录凭证：`identifier`（用户名或邮箱）+ `password`
- Session 策略：JWT（7 天）
- 后台路由访问控制：未登录不可访问 `/admin/*`

---

### 3) 数据库健康检查

- **Method**: `GET`
- **Path**: `/api/health/db`
- **Auth**: 公开
- **用途**: 登录页在提交凭证前检测数据库可用性，避免将连接故障误提示为密码错误

#### 成功响应示例

```json
{ "success": true, "data": { "ok": true } }
```

#### 失败响应示例

```json
{ "success": false, "error": "Database unavailable" }
```

---

### 4) i18n 语言配置

- **Method**: `GET`
- **Path**: `/api/i18n/locales`
- **Auth**: 公开
- **用途**: Middleware 拉取当前默认语言与启用语言列表，用于 URL 语言前缀路由决策

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "defaultLocale": "en-US",
    "activeLocales": ["en-US", "zh-CN", "es-ES"]
  }
}
```

#### 失败响应示例

```json
{ "success": false, "error": "Failed to load locale config" }
```

---

## 变更记录

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-03 | 初始化 API 文档 | 收录 `/api/upload` 与 `/api/auth/*` |
| 2026-03 | 新增 DB 健康检查接口 | 收录 `/api/health/db`，用于登录前可用性探测 |
| 2026-03 | 新增 i18n 语言配置接口 | 收录 `/api/i18n/locales`，供 Middleware 获取默认/启用语言 |

---

## 新增接口模板（复制使用）

> 新增 API Route 时，复制以下模板并补全字段。

```md
### X) 接口名称

- **Method**: `GET | POST | PUT | PATCH | DELETE`
- **Path**: `/api/xxx`
- **Auth**: 需要登录 / 公开
- **Content-Type**: `application/json | multipart/form-data`

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `example` | `string` | 是 | 示例字段 |

#### 成功响应示例

```json
{ "success": true, "data": {} }
```

#### 失败响应示例

```json
{ "success": false, "error": "错误信息" }
```
```

---

## 废弃接口规范（Deprecated）

当接口进入弃用流程时，必须在本文档明确标记，格式如下：

```md
### X) 接口名称（DEPRECATED）

- **废弃状态**：Deprecated（保留兼容）
- **废弃日期**：YYYY-MM-DD
- **计划移除版本/日期**：vX.Y / YYYY-MM-DD
- **替代接口**：`METHOD /api/new-path`
- **迁移说明**：参数与响应差异、前端改造步骤
```

> 约束：接口被标记 Deprecated 后，不允许继续扩展新字段，只允许修复兼容性问题。
