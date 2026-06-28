# GOSSO Admin Console (基于 GOSSO 的单点登录统一管理后台)

这是一个基于 OIDC 单点登录架构的自托管身份平台管理系统。项目整合了 GOSSO 认证服务器、React 管理控制台前端（SPA）、自动化数据库初始化/播种工具（Seeder）以及 Nginx 统一网关，为 GOSSO 提供了一套完整的可视化管理控制面板。

---

## 🏗️ 架构设计

系统沿用了**同源反向代理网关**的设计理念，将前端 SPA 与后端核心 API 聚合在同一个域名和端口下，彻底规避了跨域（CORS）与浏览器第三方 Cookie 的访问限制。

```text
               +-----------------------------------+
               |       Nginx Gateway (8080)        |
               +-----------------------------------+
                 /               |                \
   / (SPA 静态资源)       /api/v1/admin/ (API)    /oauth2/ & /oidc/ (OIDC协议)
               /                 |                  \
  +------------------+   +------------------+   +------------------+
  |    gosso-admin-  |   |      gosso       |   |      gosso       |
  |  frontend (8083) |   |   engine (8080)  |   |   engine (8080)  |
  +------------------+   +------------------+   +------------------+
                                  |
                           +--------------+
                           |  PostgreSQL  | <--- sso-admin-seed (初始化播种)
                           +--------------+
```

* **Nginx Gateway (`localhost:8080`)**：统一流量入口网关。
  - `/` -> **gosso-admin-frontend** (React TypeScript SPA 管理面板)
  - `/api/v1/` -> **gosso** (核心认证服务 API / 管理端点)
  - `/oauth2/` & `/oidc/` & `/.well-known/` -> **gosso** (OIDC 标准协议端点)
  - `/swagger/` -> **gosso** (OIDC 引擎的 Swagger API 调试台)
* **gosso (`submodule`)**：基于 OIDC/OAuth2 协议的身份认证主服务。它不仅处理登录与令牌签发，同时也内置了 `/api/v1/admin/*` 管理端点。
* **gosso-admin-frontend**：基于 React 19 构建的单页面管理后台。自身注册为 GOSSO 的 OAuth2 客户端，通过标准的 OIDC 授权码 + PKCE 流程登录并调用 GOSSO 的管理接口。
* **sso-admin-seed**：自动化初始化播种工具，负责在数据库表迁移完成后自动注册管理员账号及后台 SPA 所需的 OAuth2 客户端配置。

---

## 📂 目录结构

```text
├── .gitignore                 # Git 忽略配置
├── README.md                  # 本文档
├── docker-compose.yml         # 本地容器编排配置
├── nginx-gateway.conf         # Nginx 反向代理网关配置
├── init.sql                   # 数据库初始库创建脚本
├── seed/                      # 自动化数据库播种服务 (Go 1.26)
│   ├── Dockerfile
│   ├── go.mod
│   └── main.go
├── gosso-admin-frontend/      # React 管理后台前端 SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── gosso/                     # GOSSO SSO 身份提供商核心服务 (Git Submodule)
```

---

## 🚀 快速开始与部署

### 1. 克隆项目与初始化子模块
克隆主仓库时需要拉取引用的 `gosso` Git 子模块：
```bash
git clone --recursive <your-repo-url>
cd gosso-admin
```
如果已经克隆了仓库但未初始化子模块，可运行：
```bash
git submodule update --init --recursive
```

### 2. 生成 GOSSO 令牌签名密钥
SSO 服务器需要 RSA 密钥对来签发/验证 OIDC 令牌（JWT）。在首次启动容器前在本地生成私钥：
```bash
# 创建密钥目录
mkdir -p gosso/keys

# 生成 RSA 私钥（公钥会在运行时由 GOSSO 自动推导并以 JWKS 形式暴露）
openssl genpkey -algorithm RSA -out gosso/keys/private.pem -pkeyopt rsa_keygen_bits:2048
```

### 3. 配置默认管理员与客户端参数
在 `docker-compose.yml` 中，你可以通过 `seed` 服务的环境变量定制你的初始管理员账号和客户端重定向地址：
```yaml
  seed:
    environment:
      - PG_DSN=host=db user=postgres password=password dbname=gosso port=5432 sslmode=disable
      - ADMIN_USERNAME=admin                               # 默认管理员用户名
      - ADMIN_PASSWORD=admin123                            # 默认管理员密码
      - ADMIN_DISPLAY_NAME=System Admin                    # 管理员显示名称
      - OAUTH2_CLIENT_REDIRECT_URIS=http://localhost:8080/callback # 后台登录回调地址
```

### 4. 运行容器化环境
使用 Docker Compose 一键编译并运行所有容器组件：
```bash
docker compose up -d --build
```
容器启动完毕后，将运行以下服务：
* `sso-admin-gateway` (Nginx 网关，监听端口 `8080`)
* `sso-admin-frontend` (React 管理面板)
* `sso-identity-provider` (GOSSO SSO 核心服务，内部端口 `8080`)
* `sso-admin-db` (PostgreSQL 15 数据库)
* `sso-admin-redis` (Redis 7 Session 缓存)
* `sso-admin-seed` (播种程序，初始化完成后自动退出)

日常开发更新后可只重建应用和前端容器，保留 PostgreSQL/Redis 数据卷：
```bash
docker compose up -d --build gosso gosso-admin-frontend gateway
```

---

## 🔑 访问与使用

1. 打开浏览器访问首页：[http://localhost:8080/](http://localhost:8080/)
2. 点击 **Sign In to Console** 会跳转到单点登录界面。
3. 登录默认 seeded 账号：
   * **用户名**：`admin` (或你在 compose 中设置的值)
   * **密码**：`admin123` (或你在 compose 中设置的值)
4. 登录成功并确认授权同意后，会自动重定向回管理面板首页 (`/admin`)。
5. 普通用户账号可以完成登录，但访问 `/admin` 时只会看到无权限提示，不会重复触发登录授权。
6. **接口文档调试**：直接访问 [http://localhost:8080/swagger](http://localhost:8080/swagger) 可以通过 Swagger 查阅和调试 GOSSO 所有的内置 Admin APIs。

---

## 📧 邮件发送服务

GOSSO 使用 SMTP 发送邮箱验证码和密码重置邮件。`gosso-admin` 的本地 Docker Compose 已内置 Mailpit，适合开发环境观察邮件内容；生产环境应改为真实 SMTP 服务。

### 开发环境（Mailpit）

默认 `docker-compose.yml` 中的 `gosso` 服务配置如下：

```env
GOUNO_SMTP_HOST=mailpit
GOUNO_SMTP_PORT=1025
GOUNO_SMTP_TLS_POLICY=notls
```

启动后可通过以下入口验证邮件：

* SMTP 服务：`mailpit:1025`（容器内部）或 `localhost:1025`（宿主机）
* Mailpit Web UI：[http://localhost:8025](http://localhost:8025)

可通过这些流程触发邮件：

* 用户登录后在 **Settings → Profile & Password** 修改邮箱，会发送邮箱验证码。
* 调用密码重置接口时会发送重置链接；开发配置中的 `auth.password_reset_base_url` 默认为 `http://localhost:3000/reset-password`，如前端入口不是该地址，需要通过 `GOUNO_AUTH_PASSWORD_RESET_BASE_URL` 覆盖。

### 生产环境（真实 SMTP）

生产环境至少需要配置：

```env
GOUNO_SMTP_HOST=smtp.example.com
GOUNO_SMTP_PORT=587
GOUNO_SMTP_USERNAME=your-smtp-user
GOUNO_SMTP_PASSWORD=your-smtp-password
GOUNO_SMTP_FROM=noreply@your-domain.com
GOUNO_SMTP_TLS_POLICY=mandatory
GOUNO_AUTH_PASSWORD_RESET_BASE_URL=https://your-domain.com/reset-password
```

注意事项：

* `GOUNO_SMTP_TLS_POLICY` 支持 `mandatory`、`opportunistic`、`notls`；生产环境禁止 `notls`，推荐使用 `mandatory`。
* 配置 SMTP 后，`GOUNO_AUTH_PASSWORD_RESET_BASE_URL` 必须设置；生产环境必须使用 HTTPS。
* `GOUNO_SMTP_FROM` 应使用已在 SMTP 服务商侧验证过的发件域名，避免被退信或进入垃圾箱。
* 不要把 SMTP 密码提交到 Git；使用部署平台 Secret、Kubernetes Secret 或 `.env.production` 本地注入。

排障时优先检查：

* `/readiness` 仅检查 PostgreSQL/Redis，不代表 SMTP 可用。
* `gosso` 容器日志会记录脱敏后的发送失败原因。
* 如果本地看不到邮件，先确认 `mailpit` 容器运行中，并访问 [http://localhost:8025](http://localhost:8025)。

---

## 🛠️ 可视化后台管理功能特性

* **OAuth2 客户端注册与管理**：
  * 支持查看、注册、修改和删除接入单点登录的应用客户端。
  * 注册**机密客户端 (Confidential Client)** 时，系统会生成唯一的 `Client Secret` 并提示拷贝（该密钥在数据库中以哈希存储，仅在创建成功时展示一次）。
* **用户账号与锁定状态控制**：
  * 列表化展示系统内的全部用户账号。
  * **新增用户**：管理员可通过 **Add User** 创建普通用户账号，填写用户名、显示名、邮箱或手机号、初始密码等信息。
  * **重置密码**：管理员可为其他用户重置密码，系统会撤销该用户已有会话；管理员不能在用户管理里重置自己的密码。
  * **锁定/解锁**：展示因密码输入错误过多而被系统自动判定的 Lockout 锁定状态（包括尝试失败次数），支持管理员一键解锁（Clear Lockout）。
  * **启用/禁用**：支持管理员 suspend/enable 账号的激活状态。
* **精细化角色绑定**：
  * 可视化查看每个用户所绑定的系统角色。
  * 支持管理员从动态收集到的角色列表中或直接通过 Role UUID 给用户添加/移除角色。
* **应用授权回收 (Consent Revocation)**：
  * 管理员可以查看每个用户授权过哪些第三方应用（以及具体获取了哪些 scopes，如 openid, email）。
  * 支持管理员代替用户强制回收应用授权关系。
* **审计日志检索 (Audit Logs)**：
  * 完整的审计历史记录：包含用户登录成功/失败、修改密码、客户端注册、会话清理等所有关键操作。
  * 提供事件类型和用户 Account ID 过滤检索。
  * 支持详情折叠面板展示，展示包含 Actor 来源 IP、浏览器 Agent 以及原始 JSON 元数据（Meta Data / Resource Data）的详细操作详情。
* **管理员自助服务**：
  * 在后台顶部可以一键调起“修改我的密码”弹窗，提供当前密码验证并修改管理员自身密码。修改成功后自动注销并在 2.5 秒后跳转登录页重新登录。
* **普通用户访问保护**：
  * 普通用户登录后访问管理台会停留在无权限页面，不会进入重复 OIDC 授权流程，避免触发登录限流。

---

## 📘 开发者集成指南 (对于接手 Agent 的提示)

1. **GOSSO 的管理 APIs 定义**：
   * 所有针对用户和应用的管理操作均不单独起后端，而是复用 `gosso` 内部的 `internal/admin/controller/admin_controller.go` 代码。该控制器注册了诸如 `/api/v1/admin/accounts` 等端点。
   * 前端管理界面通过 Nginx 代理将请求转发给 GOSSO，并由 GOSSO 中的 `AdminRequiredMiddleware` 拦截，确保请求者持有同时具备 `admin` scope 和 `admin` 角色的合法 Access Token。
   * `gosso-admin-spa` 必须作为后台能力 client 预置：`metadata.capability=admin`，且 allowed scopes 包含 `admin`。普通 client 自助注册/更新不得声明 `admin` / `admin:*` scopes；已具备 `admin` role + `admin` scope 的管理员可在后台显式授予或移除该特殊 scope。
   * 已登录但不具备 `admin` 角色，或 token 不是由后台能力 client 以 `admin` scope 签发的用户，由前端/API 显示无权限状态；只有未登录用户才会被重定向到 OIDC 授权流程。
2. **本地前端 SPA 开发调试**：
   * 如果你需要本地调试 React 页面：
     ```bash
     cd gosso-admin-frontend
     npm install --legacy-peer-deps # 处理 React 19 和 lucide-react 依赖告警
     npm run dev
     ```
   * 开发服务器运行在 `8083` 端口上，可以通过修改根目录 Nginx 配置或直接通过网关配合调试。
3. **Seeder 与数据库启动顺序**：
   * `sso-admin-seed` 服务会在启动后轮询检测 PostgreSQL 数据库，并等待 `accounts` 表存在（意味着 `gosso` 容器已经跑完了 schema 数据库迁移）。只有检测到迁移完成后，Seeder 才会执行数据写入，以防止并发启动时的冲突。
