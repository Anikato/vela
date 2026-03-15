# Vela

Vela 是一套开源的多语言展示型网站系统，专为 B2B 外贸独立站设计。后台管理所有内容，前台自动多语言渲染，开箱即用。

## 核心功能

- **产品管理** — 多 SKU、多图、多分类、标签、附件、批量导入导出
- **询盘系统** — 询盘篮 + 表单 + 邮件通知 + 后台管理
- **页面区块** — 18 种区块类型自由搭建页面（Hero、轮播、富文本、FAQ 等）
- **新闻管理** — 发布文章、分类、SEO 优化
- **多语言** — UI 翻译 + 内容翻译 + Azure 自动翻译 + 语言切换
- **主题系统** — 可视化调色板、字体、圆角等全站风格定制
- **SEO** — 元数据、结构化数据、hreflang、Sitemap、Open Graph
- **导航管理** — 多级菜单、内部/外部/分类/页面链接
- **媒体库** — 图片自动 WebP 转换 + 多尺寸裁剪 + 文档管理
- **审计日志** — 记录所有后台操作，便于追溯

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15 (App Router) + React 19 |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | Auth.js (JWT) |
| 图片处理 | Sharp (WebP/多尺寸) |
| 日志 | Pino (结构化 JSON) |
| 部署 | Docker + GitHub Actions CI/CD |

---

## 快速部署（Docker）

### 前置条件

- Docker Engine 20+
- Docker Compose v2+
- 一个域名（用于 HTTPS 访问）

### 1. 创建项目目录

```bash
mkdir -p /data/vela && cd /data/vela
```

### 2. 获取配置文件

```bash
# 下载 docker-compose 和 nginx 配置
curl -O https://raw.githubusercontent.com/Anikato/vela/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/Anikato/vela/main/nginx.conf.example
```

### 3. 创建环境变量

```bash
cat > .env << 'EOF'
# [必填] Auth.js 签名密钥
AUTH_SECRET=<生成方法见下方>

# [必填] 站点公开 URL（含协议，不带尾斜杠）
SITE_URL=https://your-domain.com

# [推荐修改] 数据库密码
DB_PASSWORD=YourStrongPassword

# [推荐] SMTP 密码加密密钥
SMTP_ENCRYPTION_KEY=<生成方法见下方>

# [可选] 修改应用监听端口（默认 127.0.0.1:3000）
# APP_PORT=127.0.0.1:3000

# [可选] 修改 Uptime Kuma 端口（默认 127.0.0.1:3001）
# UPTIME_PORT=127.0.0.1:3001
EOF
```

生成密钥：

```bash
# AUTH_SECRET
openssl rand -base64 32

# SMTP_ENCRYPTION_KEY
openssl rand -hex 32
```

### 4. 启动服务

```bash
docker compose -f docker-compose.prod.yml up -d
```

首次启动会自动执行数据库迁移和初始化。等待约 30 秒后访问：

| 地址 | 说明 |
|---|---|
| `http://127.0.0.1:3000` | 网站前台 |
| `http://127.0.0.1:3000/admin` | 管理后台 |

默认管理员账号：

| 项 | 值 |
|---|---|
| 邮箱 | `admin@vela.com` |
| 密码 | `admin123` |

> **首次登录后请立即修改密码。**

---

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `AUTH_SECRET` | 是 | — | Auth.js JWT 签名密钥 |
| `SITE_URL` | 是 | `http://localhost:3000` | 站点公开 URL（影响 SEO / OG 链接） |
| `DB_PASSWORD` | 否 | `VelaSecure2026` | PostgreSQL 密码 |
| `APP_PORT` | 否 | `127.0.0.1:3000` | 应用监听地址:端口 |
| `VELA_IMAGE` | 否 | `l97312/vela:latest` | Docker 镜像地址 |
| `STORAGE_TYPE` | 否 | `local` | 文件存储：`local` 或 `s3` |
| `S3_ENDPOINT` | S3 时 | — | S3 兼容端点 URL |
| `S3_REGION` | S3 时 | — | S3 区域 |
| `S3_BUCKET` | S3 时 | — | 存储桶名称 |
| `S3_ACCESS_KEY` | S3 时 | — | 访问密钥 |
| `S3_SECRET_KEY` | S3 时 | — | 秘密密钥 |
| `S3_PUBLIC_URL` | S3 时 | — | 文件公开访问 URL |
| `SMTP_ENCRYPTION_KEY` | 否 | — | SMTP 密码 AES-256 加密密钥 |
| `UPTIME_PORT` | 否 | `127.0.0.1:3001` | Uptime Kuma 监控端口 |

---

## 反向代理

### Nginx / OpenResty

将 `nginx.conf.example` 复制到 Nginx 配置目录并修改域名和证书路径：

```bash
cp nginx.conf.example /etc/nginx/sites-enabled/vela.conf
# 编辑 server_name、ssl_certificate、ssl_certificate_key
nginx -t && nginx -s reload
```

关键配置说明：

- `client_max_body_size 50m` — 允许上传最大 50MB 文件
- `location /uploads/` — 可配置为 Nginx 直接服务静态文件（绕过 Node.js）
- `proxy_set_header` — 确保应用获取真实 IP 和协议

### Caddy（自动 HTTPS）

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

---

## 文件存储

### 本地存储（默认）

上传文件保存在 `./data/uploads/`，通过 Docker 挂载到容器内 `/app/public/uploads/`。

```
./data/uploads/
└── 2026/
    └── 03/
        └── <uuid>/
            ├── original.webp
            ├── thumbnail.webp
            ├── small.webp
            ├── medium.webp
            └── large.webp
```

备份上传文件：

```bash
tar czf uploads-backup-$(date +%Y%m%d).tar.gz data/uploads/
```

### S3 / Cloudflare R2

在 `.env` 中配置 S3 相关变量后重启即可，无需修改代码：

```bash
STORAGE_TYPE=s3
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=vela-media
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_PUBLIC_URL=https://media.your-domain.com
```

---

## CI/CD

项目包含两个 GitHub Actions 工作流：

### CI（`.github/workflows/ci.yml`）

推送到 `main` 或发起 PR 时自动运行：

1. **Lint** — ESLint 代码检查
2. **Type check** — TypeScript 类型检查
3. **Test** — Vitest 单元测试

### Docker 镜像构建（`.github/workflows/docker-publish.yml`）

触发条件：

- CI 通过后自动触发
- 推送 `v*` 标签时触发
- 手动 `workflow_dispatch`

构建 `linux/amd64` + `linux/arm64` 双平台镜像并推送到 Docker Hub。

### 配置 GitHub Secrets

在仓库 Settings > Secrets and variables > Actions 中添加：

| Secret | 说明 |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |

---

## 备份与监控

### 自动数据库备份

`docker-compose.prod.yml` 包含 `backup` 容器，使用 [postgres-backup-local](https://github.com/prodrigestivill/docker-postgres-backup-local) 自动备份：

| 配置 | 值 |
|---|---|
| 备份时间 | 每天凌晨 2:00 |
| 日备份保留 | 7 天 |
| 周备份保留 | 4 周 |
| 月备份保留 | 6 个月 |
| 存储位置 | `./data/backups/` |

手动备份：

```bash
docker exec vela-db pg_dump -U vela vela > backup-$(date +%Y%m%d).sql
```

手动恢复：

```bash
docker exec -i vela-db psql -U vela vela < backup-20260315.sql
```

### Uptime Kuma 监控

访问 `http://127.0.0.1:3001`（或 `.env` 中配置的 `UPTIME_PORT`），首次访问需创建管理员账号。

建议添加的监控项：

- **HTTP(s)** — 监控 `https://your-domain.com`，检测间隔 60s
- **HTTP(s) - Keyword** — 监控 `http://vela-app:3000/api/health/db`，关键词 `ok`

---

## 日常运维

### 更新部署

```bash
cd /data/vela

# 拉取最新镜像
docker compose -f docker-compose.prod.yml pull

# 重启（自动执行数据库迁移）
docker compose -f docker-compose.prod.yml up -d
```

### 查看日志

```bash
# 实时日志
docker logs vela-app -f

# 最近 100 行
docker logs vela-app --tail 100

# 过滤错误（Pino JSON 格式）
docker logs vela-app 2>&1 | grep '"level":"error"'
```

### 重启服务

```bash
# 重启应用
docker compose -f docker-compose.prod.yml restart app

# 重启所有服务
docker compose -f docker-compose.prod.yml restart
```

### 进入数据库

```bash
docker exec -it vela-db psql -U vela -d vela
```

### 故障排查

| 现象 | 排查方向 |
|---|---|
| 容器无法启动 | `docker logs vela-app` 查看错误 |
| 数据库连接失败 | 检查 `vela-db` 是否健康：`docker ps` |
| 上传失败 | 检查 `data/uploads/` 权限：`ls -la data/` |
| 图片 404 | 检查卷挂载：`docker inspect vela-app --format '{{json .Mounts}}'` |
| 端口被占用 | 在 `.env` 中修改 `APP_PORT` 或 `UPTIME_PORT` |
| 内存不足 | 调整 `docker-compose.prod.yml` 中 `deploy.resources.limits` |

---

## 本地开发

### 前置条件

- Node.js 22+
- pnpm 10+
- Docker（用于开发数据库）

### 启动开发环境

```bash
# 安装依赖
pnpm install

# 启动开发数据库
docker compose up -d

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写 DATABASE_URL 等

# 初始化数据库
pnpm db:push
pnpm db:seed

# 启动开发服务器
pnpm dev
```

### 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 运行测试 |
| `pnpm db:push` | 同步数据库 Schema |
| `pnpm db:seed` | 初始化种子数据 |
| `pnpm db:studio` | 打开 Drizzle Studio |
| `pnpm format` | Prettier 格式化 |

---

## 目录结构

```
vela/
├── .github/workflows/     # CI/CD 工作流
├── docs/                   # 产品规格书、技术方案等内部文档
├── public/                 # 静态资源
├── scripts/                # 迁移和种子脚本
├── src/
│   ├── app/                # Next.js 路由（前台 + 后台）
│   ├── components/         # UI 组件（admin/ + website/）
│   ├── hooks/              # React Hooks
│   ├── lib/                # 工具函数（i18n、SEO、校验等）
│   ├── server/
│   │   ├── actions/        # Server Actions
│   │   ├── db/             # 数据库 Schema + 迁移
│   │   ├── services/       # 业务逻辑层
│   │   └── storage/        # 文件存储适配器
│   └── types/              # 全局类型定义
├── docker-compose.prod.yml # 生产环境编排
├── docker-compose.yml      # 开发环境编排
├── Dockerfile              # 多阶段构建
└── nginx.conf.example      # Nginx 反向代理模板
```

---

## License

MIT
