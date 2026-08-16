# HaizhuProxy — 产品与技术架构设计

> 代理分发平台（Proxy Distribution Platform）
> 官网 + 用户控制台 + 管理控制台 + Telegram 在线客服 + 开放 API + Docker 化部署

---

## 1. 产品定义

HaizhuProxy 是一个**代理节点分发与流量运营平台**，核心业务闭环：

```
用户注册（邀请码） → 商城购买 CDK → 控制台兑换流量 → 选择节点订阅 → 流量计量与余额熔断
                                                                        ↑
                              管理端：节点导入 / 卡密生成 / 商城配置 / Bot 配置 / API 密钥
```

### 1.1 角色与端

| 端 | 角色 | 能力 |
|---|---|---|
| 官网 Landing | 访客 | 节点展示、套餐、FAQ、注册入口、Telegram 浮窗 |
| 用户控制台 `/console` | 注册用户 | 概览仪表、卡密兑换、节点列表/订阅、邀请返利、账户设置 |
| 管理控制台 `/admin` | 管理员 | 仪表盘、节点导入/监控、卡密工厂、用户管控、商城入口、Telegram Bot、API 密钥、系统设置 |
| Telegram 浮窗 | 所有人 | 右下角悬浮按钮 → 小窗对话（配置驱动） |

### 1.2 关键领域模型

```
User { id, email, username, password_hash, role, invite_code, invited_by, balance_mb, traffic_used_mb, status }
Node { id, name, region, host, port, protocol, tls, traffic_in_mb, traffic_out_mb, status, note }
Cdk { id, code, traffic_mb, status(unused|used|revoked|expired), used_by, used_at, expires_at, batch }
ShopEntry { id, name, url, enabled, description }
TelegramConfig { enabled, bot_token, bot_username, chat_id, widget_title, welcome_message, placeholder }
ApiKey { id, name, key_hash, scopes, enabled, last_used_at }
TrafficLog { id, user_id, node_id, bytes_in, bytes_out, ts }   -- 流量计量
Invite { id, inviter_id, invitee_id, bonus_mb, created_at }    -- 邀请关系
```

### 1.3 流量与余额规则

- 用户余额 `balance_mb` 为可用流量（MB）。
- 兑换 CDK → 余额增加；节点会话按进出字节实时计入 `TrafficLog` 并扣减余额。
- 余额 ≤ 0 → 熔断断开全部会话，不产生超额扣费（**熔断策略**）。
- 管理端可随时调整余额、撤回卡密、封禁用户。

---

## 2. 前端架构（已完成 Phase 1）

### 2.1 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript + Vite |
| 路由 | react-router-dom（HashRouter，静态托管零配置） |
| 图标 | lucide-react（单一家族，strokeWidth 统一） |
| 字体 | Inter Variable / Space Grotesk Variable / JetBrains Mono Variable（fontsource 自托管） |
| 样式 | 手写 CSS Token 系统（无重型 UI 框架，零运行时 CSS 开销） |
| 图表 | 自研 SVG Sparkline（无图表依赖） |
| 数据 | `src/lib/api.ts` 统一契约层：mock 适配器 ↔ HTTP 适配器可切换 |

### 2.2 视觉系统（Design Tokens）

- **视觉主题**：深色精密仪器风（precision-instrument）。近黑底 `#05070a` + 单一强调色 电光青绿 `#3fd9b4`。
- **字体角色**：Space Grotesk 标题 / Inter 正文 / JetBrains Mono 数据标签。
- **密度**：官网宽松（VARIANCE 7 / MOTION 6 / DENSITY 4）；控制台驾驶舱密度（DENSITY 6）。
- **拒绝的默认**：AI 紫渐变、全屏玻璃拟态、装饰性漂浮卡片、统一圆角矩形、每元素动画。
- **Token 三层结构**：`tokens.css` 里 primitive → semantic → component 分层，全站无硬编码颜色。

### 2.3 页面地图

| 路由 | 页面 | 状态 |
|---|---|---|
| `#/` | Landing（Hero 遥测面板 / 信任条 / 节点网格 / 特性 / 三步上手 / 套餐 / FAQ / CTA） | ✅ |
| `#/login` `#/register` | 认证（注册含邀请码、赠送流量） | ✅ |
| `#/console` | 用户概览（余额、用量图表、熔断进度） | ✅ |
| `#/console/redeem` | 卡密兑换 | ✅ |
| `#/console/nodes` | 节点列表 + 订阅链接 | ✅ |
| `#/console/invite` | 邀请返利 | ✅ |
| `#/console/profile` | 账户设置 | ✅ |
| `#/admin` | 运营仪表盘 | ✅ |
| `#/admin/nodes` | 节点管理（单条/批量导入） | ✅ |
| `#/admin/cdks` | 卡密工厂（生成/导出/撤回） | ✅ |
| `#/admin/users` | 用户管理（搜索/封禁） | ✅ |
| `#/admin/shops` | 商城入口管理 | ✅ |
| `#/admin/telegram` | Telegram Bot 配置 + 测试发送 | ✅ |
| `#/admin/api` | API 密钥（作用域最小权限） | ✅ |
| `#/admin/settings` | 系统设置（注册开关/邀请奖励/熔断策略） | ✅ |
| 全局 | Telegram 浮窗客服 | ✅ |

### 2.4 交互与动效原则

- CSS transition 优先；JS 动画仅用于需要时序协调的场景（Reveal on scroll 用 IntersectionObserver）。
- 全部动画走 `transform/opacity`，尊重 `prefers-reduced-motion`。
- 状态覆盖：loading（Spinner）/ empty（EmptyState）/ error（Toast + Chip）/ hover / focus-visible / disabled / selected。
- 键盘可达：模态框 Esc 关闭、Switch role=switch、Tabs role=tablist、Toast aria-live。

### 2.5 数据契约层

`src/lib/types.ts` 定义与后端一致的领域类型；`src/lib/api.ts` 暴露同名异步函数：
- `VITE_DEMO=1`（默认）→ mock 适配器，前端可独立演示
- `VITE_DEMO=0` → fetch `/api/**`，由 Vite proxy 转发至后端 `:8000`

---

## 3. 后端架构（Phase 2）

### 3.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| API | FastAPI (Python 3.11) | 类型安全、自动 OpenAPI 文档、异步 |
| ORM | SQLAlchemy 2.x | 成熟稳定 |
| DB | SQLite（默认）/ 可换 PostgreSQL | 单机部署零依赖，环境变量切换 |
| Auth | JWT (python-jose) + PBKDF2 密码哈希 | 无外部依赖 |
| 部署 | Uvicorn + Nginx + Docker Compose | 一键起 |

### 3.2 API 分组

```
/api/auth        POST /register  POST /login  GET /me
/api/console     GET /usage  POST /redeem  GET /nodes  GET /invite  PATCH /profile
/api/admin       GET /dashboard  CRUD /nodes  GET|POST /cdks  GET|POST|PATCH /shops
                 GET|PATCH /telegram  POST /telegram/test  CRUD /api-keys  GET|PATCH /settings
                 GET /users  PATCH /users/{id}/status
/api/public      GET /regions  GET /plans  GET /shops (官网数据)
```

### 3.3 安全

- 密码：PBKDF2-HMAC-SHA256（≥210k 迭代）+ 随机盐。
- JWT：HS256，`sub=user_id`，过期 7 天；管理员路由 role 校验。
- CDK 生成：`secrets.token_hex` CSPRNG + 前缀 `HZ-` + 碰撞校验 + 唯一约束。
- API Key：明文仅创建时展示一次，库中存 SHA-256 哈希；按 scopes 鉴权。
- 登录限流：失败 5 次锁 15 分钟（内存滑窗）。
- Bot Token：仅存后端，前端返回掩码。

### 3.4 流量计量

- `TrafficLog` 按 (user_id, node_id, ts) 聚合；
- 管理端节点进出流量用于仪表盘与节点负载；
- 用户余额扣减在兑换/会话结算时执行，熔断阈值 0。

---

## 4. 部署架构

```
[Browser] → Nginx (frontend static + /api proxy)
                  ├── :80  静态站点（dist）
                  └── /api → backend:8000 (uvicorn)
[Backend] → SQLite (data/haizhu.db)  ← 挂载卷持久化
[Telegram] ← backend 通过 Bot API sendMessage（webhook 预留）
```

`docker compose up -d` 一键起；`make seed` 初始化管理员与演示数据。

---

## 5. 验收清单（多阶段）

| 阶段 | 内容 | 状态 |
|---|---|---|
| P1 前端 | 14+ 页面、响应式、无控制台错误、无横向溢出 | ✅ |
| P2 后端 | 注册/登录/邀请/CDK/节点/流量/Bot/API Key 全接口（35 路由） | ✅ |
| P3 集成 | 前端真实 API 联调（E2E 全流程通过）、双模式客户端 | ✅ |
| P4 部署 | Docker Compose、Nginx、SQLite 卷持久化、seed 自动化 | ✅ |
| P5 测试 | pytest 15 用例 + Playwright E2E 浏览器验收 | ✅ |
| P6 打包 | 源码包 + 文档 + 交付 | ✅ |
