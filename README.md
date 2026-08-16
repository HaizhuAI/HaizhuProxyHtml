# HaizhuProxy — 代理分发平台

全球代理节点分发平台：注册 / 邀请 / CDK 卡密兑换 / 节点订阅 / 流量计量与熔断 / Telegram 在线客服 / 开放 API。

![stack](https://img.shields.io/badge/React-18-3fd9b4) ![stack](https://img.shields.io/badge/FastAPI-0.115-3fd9b4) ![stack](https://img.shields.io/badge/SQLite-ready-3fd9b4) ![stack](https://img.shields.io/badge/Docker-ready-3fd9b4)

---

## 功能总览

| 模块 | 能力 |
|---|---|
| 官网 Landing | 全球节点展示、套餐、FAQ、信任数据、注册入口、Telegram 浮窗客服 |
| 注册系统 | 邮箱注册、邀请码（可选/强制）、新用户赠送流量 |
| 邀请系统 | 专属邀请码、邀请关系链、双向流量奖励、统计 |
| 卡密系统 | 管理端批量生成（CSPRNG）、批量/单条导入节点、兑换、撤回、过期 |
| 节点管理 | 单条/批量导入（share 链接自动解析）、协议（vless/vmess/trojan/ss）、状态探测、进出流量 |
| 传输协议 | tcp / ws / grpc / reality（pbk/sid/flow/SNI）全参数写入订阅与 Clash |
| 节点测速 | 用户控制台一键 TCP 延迟测速（后端探测，前端实时渲染 ms / 不可达） |
| 流量系统 | 实时计量、14 日图表、余额熔断（≤0 断开）、用户流量明细分页 |
| 卡网购买 | 管理台填写卡网地址（保存即设为主卡网），官网套餐 / 控制台兑换页一键跳转；无支付回调 |
| Telegram Bot | Token/用户名/ChatID 后台配置、测试发送、浮窗小窗对话 |
| SMTP 发件 | SMTP 参数后台配置（STARTTLS/SSL）、测试邮件、卡密生成后直发买家邮箱 |
| 订阅分发 | 每用户专属 UUID + 订阅 Token，导入节点即自动分发（v2ray / Clash / sing-box） |
| CDK 导出 | 卡密 CSV 一键导出（Excel 兼容 BOM），对账 / 交付 |
| API 网关 | 作用域 API Key（哈希存储）、仅创建时展示一次 |
| 部署 | Docker Compose 一键起、Nginx + Uvicorn、SQLite 卷持久化 |

## 目录结构

```
HaizhuProxy/
├── frontend/            # React 18 + TS + Vite（官网 + 控制台 + 管理台）
│   ├── src/lib/         # types / mock / api 双模式客户端
│   ├── src/components/  # ui 原语、布局、Telegram 浮窗、landing
│   └── src/pages/       # 15+ 页面（含管理台 SMTP 配置页）
├── backend/             # FastAPI + SQLAlchemy
│   ├── app/routers/     # auth / console / admin / public / subscribe
│   ├── app/services/    # cdk / telegram / mailer / subscription / settings
│   └── tests/           # pytest 20 用例（含 SMTP + 订阅）
├── deploy/nginx/        # 生产 Nginx 配置
├── docker-compose.yml
└── DESIGN.md            # 完整架构设计文档
```

## 快速开始

### 本地开发（双模式）

```bash
# 前端独立演示（mock 数据，无需后端）
cd frontend && npm i && npm run dev        # http://localhost:5173

# 后端 + 前端联调（真实 API）
cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python -m app.seed                          # 初始化管理员与演示数据
uvicorn app.main:app --reload --port 8000
cd frontend && VITE_DEMO=0 npm run dev      # http://localhost:5173（/api 自动代理到 8000）
```

**内置账户：**

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | admin@haizhu.dev | admin123456 |
| 演示用户 | neo@example.com | user123456 |
| 演示卡密 | `HZ-DEMO-0001-0001` | 10 GB |

### Docker 一键部署

```bash
docker compose up -d --build
# 前端 http://localhost   后端 API http://localhost:8000/api/health
# OpenAPI 文档 http://localhost:8000/docs
```

### 测试与验收

```bash
make test        # backend pytest（29 用例：+ 批量导入解析/流量明细）
make build       # frontend 生产构建
```

### SMTP 发件 + 节点导入即分发

1. 管理台 → **邮件发件**：填写 SMTP 参数（QQ/Gmail/阿里云推送等），保存后点"发送测试邮件"验证。
2. 管理台 → **卡密管理 → 生成卡密**：勾选"生成后发送到买家邮箱"并填写收件邮箱，生成即直发深色 HTML 卡密邮件（邮件失败不阻塞生成，管理台会提示原因）。
3. 管理台 → **节点管理**：添加/批量导入节点后，无需任何额外操作——所有用户订阅自动包含新节点。
4. 用户控制台 → **我的节点**：展示该用户专属订阅地址（v2ray + Clash），复制导入 v2rayN / Clash (mihomo) / sing-box 即完成分发；客户端每 24h 自动更新。

### 卡网购买地址（无需支付回调）

1. 管理台 → **卡网购买地址**：填写你的发卡网 URL（名称 + 地址），保存后自动设为主卡网并停用其余入口。
2. 用户端全部购买入口自动跳转该地址：官网流量套餐「购买」按钮、控制台「卡密兑换 → 前往商城购买」。
3. 未配置时用户端显示「商城地址未配置，请联系客服获取」，不会出现死链。

订阅地址格式：`http(s)://你的域名/api/sub/{用户订阅Token}/v2ray` 与 `/clash`。

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `HZ_DATABASE_URL` | `sqlite:///./data/haizhu.db` | 数据库连接串（可切 PostgreSQL） |
| `HZ_SECRET_KEY` | dev 值 | JWT 签名密钥，生产必改 |
| `HZ_REGISTER_ENABLED` / `HZ_INVITE_REQUIRED` | true / false | 注册策略默认值（DB 可覆盖） |
| `HZ_INVITE_BONUS_MB` | 1024 | 邀请奖励（DB 可覆盖） |
| `VITE_DEMO` | `1` | 前端 mock 模式；`0` 走真实 API |

## API 速览

```
POST /api/auth/register       注册（含邀请码，自动发放奖励）
POST /api/auth/login          登录（失败 5 次锁定 15 分钟）
GET  /api/auth/me             当前用户
GET  /api/console/usage       流量余额 + 14 日图表
POST /api/console/redeem      兑换卡密
GET  /api/console/nodes       可用节点 + 订阅地址（sub_url / clash_url）
GET  /api/console/traffic     流量明细（分页）
POST /api/console/probe/{id}  用户侧 TCP 延迟测速
GET  /api/console/invite      邀请统计
POST /api/admin/nodes/import  批量导入（share 链接/简单行，解析后落库即分发）
GET  /api/admin/cdks/export.csv 卡密 CSV 导出
GET  /api/sub/{token}/v2ray   用户订阅（v2rayN base64，免鉴权，Token 即凭证）
GET  /api/sub/{token}/clash   Clash / mihomo YAML 订阅
GET  /api/admin/smtp          读取 SMTP 配置（密码掩码）
POST /api/admin/smtp          保存 SMTP 配置
POST /api/admin/smtp/test     发送测试邮件
POST /api/admin/cdks/generate 批量生成卡密（支持 send_to_email + recipient_email 直发）
POST /api/admin/cdks/{id}/revoke  撤回卡密
POST /api/admin/nodes         添加节点（导入即分发）
POST /api/admin/telegram/test 测试 Bot
POST /api/admin/api-keys      创建 API Key
GET  /api/public/regions      官网节点数据（免鉴权）
GET  /api/health              健康检查
```

完整文档：启动后端后访问 `http://localhost:8000/docs`（Swagger UI）。

## 里程碑

- [x] P1 前端 UI + 架构（14+ 页面，响应式，零控制台错误）
- [x] P2 后端全接口（auth/invite/cdk/node/traffic/bot/api-key）
- [x] P3 前后端真实联调（Vite proxy + 双模式客户端）
- [x] P4 Docker 化部署（compose + nginx + 持久化）
- [x] P5 自动化测试（20 pytest 用例 + 浏览器验收）
- [x] P6 源码打包交付
- [x] P7 SMTP 发件系统（配置/测试/卡密直发邮箱）
- [x] P8 订阅分发（每用户 UUID + Token，导入节点即自动分发 v2ray/Clash）
- [x] P9 传输协议升级（reality / ws / grpc / flow / SNI 全参数订阅 + Clash）
- [x] P10 用户侧节点测速（TCP 延迟探测，前端实时渲染）
- [x] P11 卡密 CSV 导出（Excel 兼容）
- [x] P12 节点批量导入（vless/vmess/trojan/ss 链接自动解析 reality/ws/grpc 参数，导入即分发）
- [x] P13 用户流量明细（分页 + 节点聚合展示）
- [x] P14 卡网购买地址（管理台填 URL 即主卡网，官网/控制台购买入口统一跳转）
