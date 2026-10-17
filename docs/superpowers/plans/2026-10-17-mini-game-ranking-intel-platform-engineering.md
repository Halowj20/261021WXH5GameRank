# 微小 / 抖小游戏榜单情报平台 工程开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已冻结的 PRD V1.1、页面结构规划 V1.1 和原型 V0.1，交付一个可在本机运行、前后端与 MariaDB 协同工作的 P0 榜单情报平台。

**Architecture:** Django 单体后端提供 JSON API 与 Session 鉴权，Vue 3 SPA 通过 Vite 代理访问；抓取/OCR/抽取由进程内线程池执行，状态回写数据库；MariaDB 持久化五层数据模型；Git 按阶段打稳定标签。

**Tech Stack:** Vue 3 + TypeScript + Vite + Element Plus + Vue Router；Python 3.12 + Django 5.2 + PyMySQL；MariaDB 10.6+；Git。必要依赖仅限 `requests`、`trafilatura`、`rapidocr-onnxruntime`、`python-dotenv`。

**Baseline:**
- 产品定义 / PRD：`docs/superpowers/specs/2026-10-17-mini-game-ranking-intel-platform-design.md`（V1.1）
- 页面结构规划：`docs/页面结构规划-V1.0.md`（内容 V1.1）
- 可交互原型：`prototype-v0.1/`（V0.1，已冻结，不再修改）

> 本计划取代旧计划 `docs/superpowers/plans/2026-10-17-mini-game-ranking-intel-platform.md`（React + FastAPI 草案）。旧计划不执行、不删除。

---

## 一、已确认的技术与范围决策

1. **接口与鉴权**：原生 Django JSON 视图 + Session/CSRF；不引入 DRF。
2. **解析任务**：进程内 `ThreadPoolExecutor` 后台任务，前端轮询状态；不引入 Celery/Redis。
3. **OCR**：RapidOCR 本地适配器；测试用假实现。
4. **前端状态**：Vue `reactive` + composable；不引入 Pinia、Axios。
5. **数据库**：MariaDB；Django ORM + migrations；测试使用 MariaDB 测试库。
6. **预览范围**：沿用已确认的原型行为——预览展示标题、来源、观测/观点数量与重复标记，支持确认/取消；正文、榜单候选与入库前修正仍为 PRD §17 待确认，不纳入本期。
7. **日报范围**：草稿 → 已定稿；定稿后锁定，仅导出 Markdown；撤销/重开/版本化为 PRD §17 待确认，不纳入本期。
8. **榜单口径**：官方快照持久化为 `Snapshot`；转述对照从 `Observation` 按来源/文章聚合，不额外创建转述快照；无官方时生成一份 `provisional` 快照。
9. **P0 不含**：排名趋势图、品类看板、关联关系、日报历史对比、定时抓取、飞书同步、周报/月报。

### 必要的实现字段（非新增产品功能）

这些字段用于落地已确认的原型行为，PRD 未逐字列出，但属于实现必需：

- `Article.is_draft`、`Article.confirmed_at`：预览确认前不进入事实统计。
- `Game.category`（可指向 L2 或 L3）、`Game.category_confidence`：一条主品类路径。
- `DigestItem.generated_text`、`DigestItem.is_included`：自动生成文本与逐条勾选。
- `Conflict.platform`、`Conflict.board_type`、`Conflict.observed_date`：榜单差异的幂等重建与定位。
- `SystemSetting`：管理员维护模型配置。
- `AuditLog`：记录关键操作。
- `Game.publisher` / `Game.developer` 使用 CharField；PRD 未定义 Company 主数据，MVP 不新增公司模型。

---

## 二、环境前提

执行前必须具备：

- Python 3.12：`C:\Users\Miya\AppData\Roaming\uv\python\cpython-3.12.14-windows-x86_64-none\python.exe`
- Node.js 24 + npm 11
- MariaDB 10.6+，本地服务已启动
- Git 2.55+

数据库准备（执行阶段由开发者完成，本计划不执行）：

```sql
CREATE DATABASE ranking_intel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ranking'@'localhost' IDENTIFIED BY 'ranking_dev';
GRANT ALL PRIVILEGES ON ranking_intel.* TO 'ranking'@'localhost';
GRANT ALL PRIVILEGES ON `test_ranking_intel`.* TO 'ranking'@'localhost';
FLUSH PRIVILEGES;
```

`test_ranking_intel` 授权用于 Django 测试库创建；若 MariaDB 用户无建库权限，测试会失败。

---

## 三、目标文件结构

```text
backend/
  manage.py
  requirements.txt
  .env.example
  config/
    __init__.py                 # PyMySQL 适配
    settings.py
    urls.py
    wsgi.py
    asgi.py
  apps/
    core/
      apps.py
      models.py                 # TimeStampedModel / AuditLog / SystemSetting
      api.py                    # ok / fail / JSON helpers
      permissions.py            # role_required
      tasks.py                  # TaskRunner / ThreadPoolExecutor
      views.py                  # /api/health
      urls.py
      management/commands/seed_demo.py
      tests/
    accounts/
      apps.py
      models.py                 # UserProfile
      signals.py
      api.py                    # login / logout / me / csrf
      urls.py
      tests/
    content/
      apps.py
      models.py                 # Source / Article / Asset
      api.py                    # sources / articles
      urls.py
      tests/
    intel/
      apps.py
      models/
        __init__.py
        catalog.py              # Category / Tag / Game / Alias / GameTag / CategoryMapping
        ranking.py              # Observation / Snapshot / Entry / Conflict
        insight.py              # Claim
      services/
        catalog.py              # 名称归一 / 游戏解析 / 档案聚合
        merge.py                # 观测 -> 快照 / 条目 / 冲突
        review.py               # 待核查询
        digest.py               # 日报生成
      api/
        categories.py
        games.py
        rankings.py
        review.py
        workbench.py
      urls.py
      management/commands/seed_catalog.py
      tests/
    ingest/
      apps.py
      services/
        bundle.py               # ParseBundle / ExtractionResult
        fetch.py                # requests + trafilatura
        dedupe.py               # URL + SHA-256
        ocr.py                  # RapidOCR 适配器
        llm.py                  # OpenAI 兼容 JSON 调用
        extract.py              # 抽取结果校验 / quote 校验 / fixture
        pipeline.py             # 全流程编排 + 状态回写
      api.py                    # link / screenshot / fulltext / preview / confirm
      urls.py
      tests/
    digest/
      apps.py
      models.py                 # Digest / DigestItem
      services.py               # 生成 / 定稿 / 导出
      api.py
      urls.py
      tests/
  media/                        # 截图上传，gitignore
  data/                         # 本地辅助文件，gitignore

frontend/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  src/
    main.ts
    App.vue
    router/index.ts
    api/client.ts
    api/ingest.ts
    api/rankings.ts
    api/catalog.ts
    api/review.ts
    api/digest.ts
    api/workbench.ts
    types/index.ts
    stores/session.ts
    layouts/AppLayout.vue
    components/
      PageHeader.vue
      StatusTag.vue
      SourceBadge.vue
      EmptyState.vue
    views/
      LoginView.vue
      WorkbenchView.vue
      IngestView.vue
      ReviewView.vue
      RankingsView.vue
      GamesView.vue
      GameProfileView.vue
      ArticleView.vue
      DigestView.vue
      SettingsView.vue
    styles/main.css
```

---

## 四、阶段总览

| 阶段 | 目标 | 任务 | 完成验证 | Git |
|---|---|---|---|---|
| Phase 0 | 工程骨架、MariaDB、前后端可启动 | T1–T2 | 健康检查、数据库连接、前端构建 | `phase-0` |
| Phase 1 | 登录 + 最小情报闭环 | T3–T7 | 登录、全文投喂、观测落库、榜单可查 | `phase-1` |
| Phase 2 | 三通道投喂与后台任务 | T8–T11 | 链接/截图/全文、去重、轮询、重试 | `phase-2` |
| Phase 3 | 榜单归并、差异、待核与文章溯源 | T12–T14b | 官/转述对照、冲突结论、待核清零、文章详情 | `phase-3` |
| Phase 4 | 品类、游戏库与档案 | T15–T17 | 三级品类、别名、履历、档案编辑 | `phase-4` |
| Phase 5 | 日报生成、编辑、定稿、导出 | T18–T20 | 初稿、改写、排序、锁定、Markdown | `phase-5` |
| Phase 6 | 设置、工作台、端到端回归 | T21–T23 | 三角色权限、20 篇冒烟、数据持久化 | `phase-6` |

阶段依赖：Phase 0 → 1 → 2 → 3 → 4 → 5 → 6。Phase 3 与 Phase 4 在人力允许时可并行，但单 Agent 顺序执行。每阶段结束必须通过该阶段测试、手动冒烟并打 Git 标签；失败不进入下一阶段。

---

## 五、Phase 0：工程骨架与数据库闭环

### Task 1: 规格同步、后端骨架、MariaDB 连接与健康检查

**Files:**
- Modify: `docs/superpowers/specs/2026-10-17-mini-game-ranking-intel-platform-design.md` §13（批准后执行，PRD V1.2）
- Create: `.gitignore`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/manage.py`
- Create: `backend/config/__init__.py`
- Create: `backend/config/settings.py`
- Create: `backend/config/urls.py`
- Create: `backend/config/wsgi.py`
- Create: `backend/config/asgi.py`
- Create: `backend/apps/core/apps.py`
- Create: `backend/apps/core/models.py`
- Create: `backend/apps/core/api.py`
- Create: `backend/apps/core/views.py`
- Create: `backend/apps/core/urls.py`
- Create: `backend/apps/core/tests/__init__.py`
- Create: `backend/apps/core/tests/test_health.py`
- Create: `backend/apps/__init__.py`
- Create: `backend/apps/accounts/__init__.py`
- Create: `backend/apps/accounts/apps.py`
- Create: `backend/apps/content/__init__.py`
- Create: `backend/apps/content/apps.py`
- Create: `backend/apps/intel/__init__.py`
- Create: `backend/apps/intel/apps.py`
- Create: `backend/apps/ingest/__init__.py`
- Create: `backend/apps/ingest/apps.py`
- Create: `backend/apps/digest/__init__.py`
- Create: `backend/apps/digest/apps.py`

- [ ] **Step 1: 同步 PRD §13 技术选型**

将 PRD §13 替换为以下内容，并在修订记录追加 V1.2：

```markdown
## 13. 技术选型

- 前端：Vue 3 + TypeScript + Vite + Element Plus
- 后端：Python 3.12 + Django 5.2（原生 JSON 视图 + Session 鉴权）
- 数据库：MariaDB 10.6+（Django ORM + migrations）
- 任务：进程内线程池 + 状态回写 + 手动重试，不引入 Redis/Celery
- 文件：本地 `media/` 按日期分桶
- OCR：RapidOCR 本地适配器，可替换
- 模型：OpenAI 兼容接口，`base_url`、`api_key`、`model` 可配置
- 部署：本机前后端分离运行；后续可用 Django 托管前端构建产物
```

修订记录追加：

```markdown
| V1.2 | 2026-10-17 | 工程计划确认技术栈：Vue 3 + Django + MariaDB；前端使用 Element Plus，后端使用 Session 鉴权与进程内任务 |
```

- [ ] **Step 2: 创建分支与忽略规则**

```powershell
git checkout -b feature/engineering-mvp
```

`.gitignore` 追加：

```gitignore
.venv/
__pycache__/
*.pyc
backend/.env
backend/media/
backend/data/
frontend/node_modules/
frontend/dist/
.DS_Store
```

- [ ] **Step 3: 写依赖与环境模板**

`backend/requirements.txt`：

```text
Django==5.2.7
PyMySQL==1.1.1
python-dotenv==1.0.1
requests==2.32.3
trafilatura==2.0.0
rapidocr-onnxruntime==1.4.4
```

`backend/.env.example`：

```dotenv
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DB_NAME=ranking_intel
DB_USER=ranking
DB_PASSWORD=ranking_dev
DB_HOST=127.0.0.1
DB_PORT=3306
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=
LLM_MODEL=qwen-plus
LLM_TIMEOUT=60
OCR_ENABLED=1
TASKS_SYNC=0
TASK_WORKERS=2
```

- [ ] **Step 4: 写 Django 配置**

`backend/config/__init__.py`：

```python
import pymysql

pymysql.install_as_MySQLdb()
```

`backend/manage.py`：

```python
#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
```

`backend/config/wsgi.py`：

```python
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()
```

`backend/config/asgi.py`：

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_asgi_application()
```

`backend/apps/core/models.py`：

```python
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(TimeStampedModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)


class SystemSetting(TimeStampedModel):
    key = models.CharField(max_length=64, unique=True)
    value = models.JSONField(default=dict)
```

`backend/apps/core/api.py`：

```python
from django.http import JsonResponse


def ok(data=None, meta=None, status=200):
    payload = {"data": data}
    if meta is not None:
        payload["meta"] = meta
    return JsonResponse(payload, status=status)


def fail(code, message, status=400, details=None):
    return JsonResponse(
        {"error": {"code": code, "message": message, "details": details or {}}},
        status=status,
    )
```

`backend/apps/__init__.py`：空文件。

每个空应用的 `apps.py` 使用相同结构（替换 name/label）：

```python
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
```

`content`、`intel`、`ingest`、`digest` 分别使用 `ContentConfig`、`IntelConfig`、`IngestConfig`、`DigestConfig`。各应用 `__init__.py` 为空文件。

`backend/config/settings.py`：

```python
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = [h for h in os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",") if h]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.core",
    "apps.accounts",
    "apps.content",
    "apps.intel",
    "apps.ingest",
    "apps.digest",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "ranking_intel"),
        "USER": os.getenv("DB_USER", "ranking"),
        "PASSWORD": os.getenv("DB_PASSWORD", "ranking_dev"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
        "TEST": {"CHARSET": "utf8mb4", "COLLATION": "utf8mb4_unicode_ci"},
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

TASKS_SYNC = os.getenv("TASKS_SYNC", "0") == "1"
TASK_WORKERS = int(os.getenv("TASK_WORKERS", "2"))

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen-plus")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "60"))
OCR_ENABLED = os.getenv("OCR_ENABLED", "1") == "1"
```

- [ ] **Step 5: 写健康检查与 URL**

`backend/apps/core/apps.py`：

```python
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
```

`backend/apps/core/views.py`：

```python
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        database = "ok"
        status_code = 200
    except Exception:
        database = "error"
        status_code = 503
    return JsonResponse({"data": {"status": "ok" if database == "ok" else "degraded", "database": database}}, status=status_code)
```

`backend/apps/core/urls.py`：

```python
from django.urls import path

from . import views

urlpatterns = [path("health", views.health, name="health")]
```

`backend/config/urls.py`：

```python
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 6: 写失败测试**

`backend/apps/core/tests/test_health.py`：

```python
from django.test import TestCase


class HealthTest(TestCase):
    def test_health_returns_database_ok(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"status": "ok", "database": "ok"})
```

- [ ] **Step 7: 安装依赖并运行失败测试**

```powershell
$PY = "C:\Users\Miya\AppData\Roaming\uv\python\cpython-3.12.14-windows-x86_64-none\python.exe"
cd backend
& $PY -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py test apps.core.tests.test_health -v 2
```

Expected: 首次运行因缺少 `manage.py`/配置失败；补齐后测试应在数据库可用时 PASS。

- [ ] **Step 8: 启动并手动验证**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations core
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

另一终端：

```powershell
curl.exe http://127.0.0.1:8000/api/health
```

Expected:

```json
{"data":{"status":"ok","database":"ok"}}
```

- [ ] **Step 9: 提交**

```powershell
git add .gitignore backend docs/superpowers/specs/2026-10-17-mini-game-ranking-intel-platform-design.md
git commit -m "chore: 建立 Django 后端骨架与 MariaDB 健康检查"
```

---

### Task 2: Vue 3 前端骨架、路由、布局与 API 客户端

**Files:**
- Create: `frontend/`（Vite 生成）
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.ts`
- Modify: `frontend/src/App.vue`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/stores/session.ts`
- Create: `frontend/src/layouts/AppLayout.vue`
- Create: `frontend/src/views/LoginView.vue`
- Create: `frontend/src/views/WorkbenchView.vue`
- Create: `frontend/src/styles/main.css`

- [ ] **Step 1: 生成 Vite 项目并安装依赖**

```powershell
cd ..
npm create vite@latest frontend -- --template vue-ts
cd frontend
npm install
npm install element-plus @element-plus/icons-vue vue-router@4 dayjs
npm install -D vue-tsc
```

- [ ] **Step 2: 配置 Vite 代理**

`frontend/vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false },
      '/media': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
  build: { outDir: 'dist' },
})
```

- [ ] **Step 3: 写 API 客户端**

`frontend/src/api/client.ts`：

```ts
type ApiError = { code: string; message: string; details?: Record<string, unknown> }

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRFToken', csrfToken())
  const response = await fetch(path, { ...options, method, headers, credentials: 'include' })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = (payload as { error?: ApiError }).error
    throw new Error(error?.message || `请求失败（${response.status}）`)
  }
  return (payload as { data: T }).data
}

export async function ensureCsrf(): Promise<void> {
  await fetch('/api/auth/csrf', { credentials: 'include' })
}
```

- [ ] **Step 4: 写路由与会话**

`frontend/src/stores/session.ts`：

```ts
import { reactive } from 'vue'
import { api } from '../api/client'

export type Role = 'operator' | 'lead' | 'admin'
export type User = { id: number; username: string; name: string; role: Role }

export const session = reactive<{ user: User | null; loaded: boolean }>({ user: null, loaded: false })

export async function loadMe() {
  try { session.user = await api<User>('/api/auth/me') }
  catch { session.user = null }
  finally { session.loaded = true }
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' })
  session.user = null
}
```

`frontend/src/router/index.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { session } from '../stores/session'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', component: () => import('../views/WorkbenchView.vue') },
      { path: 'ingest', component: () => import('../views/IngestView.vue'), meta: { roles: ['operator', 'admin'] } },
      { path: 'review', component: () => import('../views/ReviewView.vue'), meta: { roles: ['operator', 'admin'] } },
      { path: 'rankings', component: () => import('../views/RankingsView.vue') },
      { path: 'games', component: () => import('../views/GamesView.vue') },
      { path: 'games/:id', component: () => import('../views/GameProfileView.vue') },
      { path: 'articles/:id', component: () => import('../views/ArticleView.vue') },
      { path: 'digest/:date', component: () => import('../views/DigestView.vue') },
      { path: 'settings', component: () => import('../views/SettingsView.vue'), meta: { roles: ['admin'] } },
    ],
  },
]

export const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  if (!session.loaded) await import('../stores/session').then((m) => m.loadMe())
  if (to.meta.public) return true
  if (!session.user) return '/login'
  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(session.user.role)) return '/'
  return true
})
```

- [ ] **Step 5: 写布局与占位页面**

`frontend/src/layouts/AppLayout.vue`：

```vue
<template>
  <el-container class="app-shell">
    <el-aside width="224px" class="sidebar">
      <div class="brand">榜<br><span>榜单情报台</span></div>
      <el-menu :default-active="$route.path" router class="nav" background-color="transparent" text-color="#c9d4cf" active-text-color="#ffffff">
        <el-menu-item index="/"><el-icon><DataBoard /></el-icon>今日工作台</el-menu-item>
        <el-menu-item v-if="canWrite" index="/ingest"><el-icon><Inbox /></el-icon>投喂台</el-menu-item>
        <el-menu-item v-if="canWrite" index="/review"><el-icon><List /></el-icon>待核队列</el-menu-item>
        <el-menu-item index="/rankings"><el-icon><TrendCharts /></el-icon>榜单中心</el-menu-item>
        <el-menu-item index="/games"><el-icon><Gamepad /></el-icon>游戏库</el-menu-item>
        <el-menu-item :index="`/digest/${today}`"><el-icon><Document /></el-icon>日报编辑器</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings"><el-icon><Setting /></el-icon>设置</el-menu-item>
      </el-menu>
      <div class="user-box">
        <span>{{ session.user?.name }} · {{ roleLabel }}</span>
        <el-button link @click="onLogout">退出</el-button>
      </div>
    </el-aside>
    <el-main><router-view /></el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { DataBoard, Inbox, List, TrendCharts, Gamepad, Document, Setting } from '@element-plus/icons-vue'
import { session, logout } from '../stores/session'

const router = useRouter()
const today = dayjs().format('YYYY-MM-DD')
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const isAdmin = computed(() => session.user?.role === 'admin')
const roleLabel = computed(() => ({ operator: '运营', lead: '负责人', admin: '管理员' } as Record<string, string>)[session.user?.role || 'operator'])

async function onLogout() {
  await logout()
  router.replace('/login')
}
</script>
```

`frontend/src/views/LoginView.vue` 先写占位表单（Task 3 接入真实登录）：

```vue
<template>
  <div class="login-page">
    <el-card class="login-card">
      <h1>榜单情报台</h1>
      <el-form label-position="top">
        <el-form-item label="用户名"><el-input v-model="username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="password" type="password" /></el-form-item>
        <el-button type="primary" class="full" @click="submit">登录</el-button>
      </el-form>
      <p class="hint">演示账号由 seed_demo 创建</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const username = ref('operator')
const password = ref('operator123')
function submit() { /* Task 3 接入 /api/auth/login */ }
</script>
```

`frontend/src/views/WorkbenchView.vue` 占位：

```vue
<template>
  <div>
    <h1>今日工作台</h1>
    <el-empty description="Phase 1 接入真实数据" />
  </div>
</template>
```

- [ ] **Step 5b: 创建其余页面占位文件**

```powershell
$views = @('IngestView','ReviewView','RankingsView','GamesView','GameProfileView','ArticleView','DigestView','SettingsView')
foreach ($v in $views) {
  if (!(Test-Path "src/views/$v.vue")) {
    Set-Content -Path "src/views/$v.vue" -Value '<template><el-empty description="待实现" /></template>'
  }
}
```

这些占位文件确保 Task 2 的 Vite 构建可以解析全部路由；后续任务逐个替换为真实页面。

- [ ] **Step 6: 写入口与样式**

`frontend/src/main.ts`：

```ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

createApp(App).use(ElementPlus).use(router).mount('#app')
```

`frontend/src/App.vue`：

```vue
<template>
  <router-view />
</template>
```

`frontend/src/styles/main.css` 至少包含 `:root` 令牌、`.app-shell`、`.sidebar`、`.login-page`、`.full`，并保证 `el-main` 有内边距。

- [ ] **Step 7: 构建验证**

```powershell
npm run build
```

Expected: `vite build` 成功，无 TS 错误。

- [ ] **Step 8: 启动验证**

```powershell
npm run dev
```

访问 `http://localhost:5173/login`，确认页面可渲染；访问 `/api/health` 代理返回 `database: ok`。

- [ ] **Step 9: 提交并打 Phase 0 标签**

```powershell
git add frontend
git commit -m "chore: 建立 Vue 3 前端骨架与路由布局"
git tag phase-0
```

---

## 六、Phase 1：登录与最小情报闭环

### Task 3: Session 登录、角色与权限

**Files:**
- Modify: `backend/apps/accounts/apps.py`
- Create: `backend/apps/accounts/models.py`
- Create: `backend/apps/accounts/signals.py`
- Create: `backend/apps/accounts/api.py`
- Create: `backend/apps/accounts/urls.py`
- Create: `backend/apps/core/permissions.py`
- Create: `backend/apps/accounts/tests/test_auth.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 写角色模型与信号**

`backend/apps/accounts/models.py`：

```python
from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class UserProfile(TimeStampedModel):
    class Role(models.TextChoices):
        OPERATOR = "operator", "运营"
        LEAD = "lead", "负责人"
        ADMIN = "admin", "管理员"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.OPERATOR)
    title = models.CharField(max_length=64, blank=True)
```

`backend/apps/accounts/signals.py`：

```python
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
```

`backend/apps/accounts/apps.py` 的 `ready()` 导入 signals。

- [ ] **Step 2: 写 API 与权限装饰器**

`backend/apps/core/permissions.py`：

```python
from functools import wraps

from .api import fail


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return fail("unauthenticated", "请先登录", 401)
            role = getattr(getattr(request.user, "profile", None), "role", None)
            if role not in roles:
                return fail("forbidden", "当前角色无权限", 403)
            return view(request, *args, **kwargs)
        return wrapper
    return decorator
```

`backend/apps/accounts/api.py`：

```python
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.core.api import fail, ok


def user_payload(user):
    profile = getattr(user, "profile", None)
    return {
        "id": user.id,
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "role": profile.role if profile else "operator",
    }


@ensure_csrf_cookie
@require_GET
def csrf(request):
    return ok({"csrf": "cookie"})


@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return fail("invalid_json", "请求体不是合法 JSON", 400)
    user = authenticate(request, username=payload.get("username", ""), password=payload.get("password", ""))
    if not user:
        return fail("invalid_credentials", "用户名或密码错误", 401)
    login(request, user)
    return ok(user_payload(user))


@require_GET
def me(request):
    if not request.user.is_authenticated:
        return fail("unauthenticated", "请先登录", 401)
    return ok(user_payload(request.user))


@require_POST
def logout_view(request):
    logout(request)
    return ok({"ok": True})
```

`backend/apps/accounts/urls.py`：

```python
from django.urls import path

from . import api

urlpatterns = [
    path("csrf", api.csrf),
    path("login", api.login_view),
    path("me", api.me),
    path("logout", api.logout_view),
]
```

`backend/config/urls.py` 增加：

```python
path("api/auth/", include("apps.accounts.urls")),
```

- [ ] **Step 3: 写测试**

`backend/apps/accounts/tests/test_auth.py`：

```python
import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile


class AuthTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()

    def test_login_sets_session_and_returns_role(self):
        response = self.client.post("/api/auth/login", data=json.dumps({"username": "operator", "password": "operator123"}), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["role"], "operator")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    def test_bad_password_returns_401(self):
        response = self.client.post("/api/auth/login", data=json.dumps({"username": "operator", "password": "bad"}), content_type="application/json")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "invalid_credentials")

    def test_me_requires_login(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
```

- [ ] **Step 4: 运行测试**

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py test apps.accounts -v 2
```

Expected: 3 tests PASS。

- [ ] **Step 5: 接入前端真实登录**

`frontend/src/views/LoginView.vue` 的 `submit` 改为：

```ts
import { ensureCsrf, api } from '../api/client'
import { session, type User } from '../stores/session'
import { useRouter } from 'vue-router'

const router = useRouter()
async function submit() {
  await ensureCsrf()
  session.user = await api<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: username.value, password: password.value }),
  })
  await router.replace('/')
}
```

- [ ] **Step 6: 创建本地演示用户**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations accounts
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py shell -c "from django.contrib.auth import get_user_model; from apps.accounts.models import UserProfile; u,_=get_user_model().objects.get_or_create(username='operator'); u.set_password('operator123'); u.save(); u.profile.role=UserProfile.Role.OPERATOR; u.profile.save()"
```

Expected: 可用 `operator / operator123` 登录。

- [ ] **Step 7: 提交**

```powershell
git add backend/apps/accounts backend/apps/core/permissions.py backend/config/urls.py frontend/src/views/LoginView.vue
git commit -m "feat: Session 登录与角色权限"
```

---

### Task 4: 内容层模型、公众号与文章 API

**Files:**
- Modify: `backend/apps/content/apps.py`
- Create: `backend/apps/content/models.py`
- Create: `backend/apps/content/api.py`
- Create: `backend/apps/content/urls.py`
- Create: `backend/apps/content/tests/test_content.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 写模型**

`backend/apps/content/models.py`：

```python
from django.db import models

from apps.core.models import TimeStampedModel


class Source(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "启用"
        PAUSED = "paused", "暂停"

    name = models.CharField(max_length=128, unique=True)
    platforms = models.JSONField(default=list)
    weight = models.PositiveSmallIntegerField(default=3)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    note = models.CharField(max_length=255, blank=True)


class Article(TimeStampedModel):
    class Method(models.TextChoices):
        LINK = "link", "链接"
        SCREENSHOT = "screenshot", "截图"
        FULLTEXT = "fulltext", "全文"

    class Status(models.TextChoices):
        RECEIVED = "received", "已接收"
        FETCHED = "fetched", "已抓取"
        PARSED = "parsed", "已解析"
        DEDUPED = "deduped", "已去重"
        EXTRACTED = "extracted", "已抽取"
        CATEGORIZED = "categorized", "已归类"
        NEEDS_REVIEW = "needs_review", "待人工确认"
        FAILED = "failed", "失败"
        PUBLISHED = "published", "已发布"

    source = models.ForeignKey(Source, null=True, blank=True, on_delete=models.SET_NULL, related_name="articles")
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=1024, unique=True, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    fetched_at = models.DateTimeField(null=True, blank=True)
    raw_text = models.TextField(blank=True)
    raw_html = models.TextField(blank=True)
    ingest_method = models.CharField(max_length=16, choices=Method.choices)
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)
    parse_status = models.CharField(max_length=24, choices=Status.choices, default=Status.RECEIVED, db_index=True)
    failure_reason = models.TextField(blank=True)
    is_draft = models.BooleanField(default=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class Asset(TimeStampedModel):
    class Type(models.TextChoices):
        SCREENSHOT = "screenshot", "截图"
        TABLE = "table", "表格"
        COVER = "cover", "封面"

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="assets")
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.SCREENSHOT)
    file = models.FileField(upload_to="assets/%Y/%m/%d/")
    ocr_text = models.TextField(blank=True)
    ocr_confidence = models.FloatField(null=True, blank=True)
```

- [ ] **Step 2: 写 API**

`backend/apps/content/api.py` 提供：

- `GET /api/sources`：全部登录用户可读，返回 `id,name,platforms,weight,status,note`。
- `POST /api/sources`、`PATCH /api/sources/<id>`：仅管理员。
- `GET /api/articles?status=&limit=`：全部登录用户，按创建时间倒序，默认 50。
- `GET /api/articles/<id>`：正文、素材、观测、观点摘要；全部登录用户。

实现要点：

```python
@require_GET
def list_sources(request):
    data = list(Source.objects.values("id", "name", "platforms", "weight", "status", "note"))
    return ok(data)


@role_required("admin")
@require_POST
def create_source(request):
    payload = json.loads(request.body or "{}")
    name = (payload.get("name") or "").strip()
    if not name:
        return fail("invalid_name", "公众号名称不能为空", 400)
    source, created = Source.objects.get_or_create(
        name=name,
        defaults={"platforms": payload.get("platforms", []), "weight": payload.get("weight", 3), "note": payload.get("note", "")},
    )
    if not created:
        return fail("duplicate_source", "公众号已存在", 409)
    return ok({"id": source.id}, status=201)
```

- [ ] **Step 3: 写测试**

覆盖：未登录 401；管理员创建 source；重复 source 409；operator 创建 403；文章列表返回。

- [ ] **Step 4: 运行测试**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations content
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py test apps.content -v 2
```

Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add backend/apps/content backend/config/urls.py
git commit -m "feat: 内容层模型与公众号文章 API"
```

---

### Task 5: 三级品类、游戏主数据与种子命令

**Files:**
- Modify: `backend/apps/intel/apps.py`
- Create: `backend/apps/intel/models/__init__.py`
- Create: `backend/apps/intel/models/catalog.py`
- Create: `backend/apps/intel/services/catalog.py`
- Create: `backend/apps/intel/api/categories.py`
- Create: `backend/apps/intel/api/games.py`
- Create: `backend/apps/intel/urls.py`
- Create: `backend/apps/intel/management/commands/seed_catalog.py`
- Create: `backend/apps/intel/tests/test_catalog.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 写品类与游戏模型**

`catalog.py` 至少包含 `Category`、`Tag`、`Game`、`Alias`、`GameTag`、`CategoryMapping`，字段按 PRD §5.3，使用 `TimeStampedModel`。关键约束：

```python
from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    level = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=64)
    sort = models.IntegerField(default=0)
    status = models.CharField(max_length=16, default="active")

    class Meta:
        unique_together = [("parent", "name")]
        ordering = ["level", "sort", "id"]

    def clean(self):
        if self.level == 1 and self.parent_id:
            raise ValidationError("L1 不能有上级")
        if self.level in (2, 3) and (not self.parent_id or self.parent.level != self.level - 1):
            raise ValidationError("L2/L3 必须挂在上二级")
        if self.level > 3:
            raise ValidationError("品类最多三级")


class Game(TimeStampedModel):
    canonical_name = models.CharField(max_length=128, unique=True)
    publisher = models.CharField(max_length=128, blank=True)
    developer = models.CharField(max_length=128, blank=True)
    platforms = models.JSONField(default=list)
    release_date = models.DateField(null=True, blank=True)
    online_status = models.CharField(max_length=32, default="运营中")
    has_isbn = models.BooleanField(default=False)
    first_seen_at = models.DateTimeField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="games")
    category_source = models.CharField(max_length=8, choices=[("ai", "AI"), ("human", "人工")], default="ai")
    category_confidence = models.FloatField(default=0)
    quality_flags = models.JSONField(default=list)
    tags = models.ManyToManyField(Tag, through="GameTag", related_name="games")

    @property
    def category_path(self):
        if not self.category:
            return []
        node = self.category
        path = [node.name]
        while node.parent_id:
            node = node.parent
            path.append(node.name)
        return list(reversed(path))
```

`backend/apps/intel/models/__init__.py`：

```python
from .catalog import Alias, Category, CategoryMapping, Game, GameTag, Tag

__all__ = ["Alias", "Category", "CategoryMapping", "Game", "GameTag", "Tag"]
```

- [ ] **Step 2: 写名称归一与游戏解析**

`backend/apps/intel/services/catalog.py`：

```python
import re
import unicodedata

from apps.intel.models import Alias, Game


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    value = re.sub(r"[\s·・:：\-—_（）()【】\[\]《》<>\"'“”‘’!！?？]+", "", value)
    return value.lower()


def resolve_game(raw_name: str):
    key = normalize_name(raw_name)
    for game in Game.objects.all():
        if normalize_name(game.canonical_name) == key:
            return game
    for alias in Alias.objects.select_related("game"):
        if normalize_name(alias.alias) == key:
            return alias.game
    return None
```

- [ ] **Step 3: 写种子命令**

`seed_catalog.py` 创建至少 5 个 L1、对应的 L2/L3，以及 8 款游戏（含别名与品类路径）。命令必须幂等（`get_or_create`）。

示例：

```python
TREE = {
    "休闲益智": {"消除": ["三消", "合成消除"], "解谜": ["物理解谜"]},
    "策略": {"塔防": ["放置塔防", "传统塔防"]},
    "模拟经营": {"经营养成": ["餐厅", "农场"]},
    "角色扮演": {"放置RPG": ["挂机", "卡牌放置"]},
    "休闲竞技": {"派对": ["派对竞技", "io竞技"]},
}
```

- [ ] **Step 4: 写品类树与游戏 API**

- `GET /api/categories/tree`：返回嵌套 L1/L2/L3。
- `GET /api/games?q=&platform=&category=`：返回 id、主名、品类路径、平台、质量标记。
- `GET /api/games/<id>`：返回档案摘要（基础身份、品类、标签、质量）。
- `POST /api/categories`、`PATCH /api/games/<id>`：运营/管理员可写；`POST /api/categories` 仅管理员。

> 创建/修改 Category 时必须显式调用 `full_clean()` 并捕获 `ValidationError`，否则 `Model.clean()` 不会自动执行。

- [ ] **Step 5: 写测试**

覆盖：品类最多三级；建 L2 必须挂 L1；`normalize_name` 去掉空格与全角符号；`resolve_game` 命中别名；游戏列表筛选。

- [ ] **Step 6: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations intel
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_catalog -v 2
git add backend/apps/intel backend/config/urls.py
git commit -m "feat: 三级品类与游戏主数据"
```

---

### Task 6: 全文投喂、固定抽取器、归并与榜单 API

**Files:**
- Create: `backend/apps/intel/models/ranking.py`
- Create: `backend/apps/intel/models/insight.py`
- Create: `backend/apps/intel/models/__init__.py`（导出全部模型）
- Create: `backend/apps/intel/services/merge.py`
- Create: `backend/apps/intel/api/rankings.py`
- Create: `backend/apps/ingest/services/bundle.py`
- Create: `backend/apps/ingest/services/extract.py`
- Create: `backend/apps/ingest/services/pipeline.py`
- Create: `backend/apps/ingest/api.py`
- Create: `backend/apps/ingest/urls.py`
- Create: `backend/apps/ingest/tests/test_ingest_fulltext.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 写观测、快照、条目、观点与冲突模型**

按 PRD §5.2/§5.4，并加入必要实现字段：

```python
class Observation(TimeStampedModel):
    article = models.ForeignKey("content.Article", null=True, blank=True, on_delete=models.CASCADE, related_name="observations")
    asset = models.ForeignKey("content.Asset", null=True, blank=True, on_delete=models.SET_NULL, related_name="observations")
    platform = models.CharField(max_length=32, choices=[("wechat_mini", "微信小游戏"), ("douyin_mini", "抖音小游戏")])
    board_type = models.CharField(max_length=16, choices=[("hot", "热门榜"), ("revenue", "畅销榜"), ("new", "新游榜")])
    observed_date = models.DateField()
    rank = models.PositiveSmallIntegerField()
    game = models.ForeignKey(Game, null=True, blank=True, on_delete=models.SET_NULL, related_name="observations")
    raw_game_name = models.CharField(max_length=128)
    trend_raw = models.CharField(max_length=64, blank=True)
    source_type = models.CharField(max_length=24, choices=[("official_original", "官方原始"), ("article_citation", "公众号转述"), ("manual", "人工整理")])
    confidence = models.FloatField(default=1)

    class Meta:
        indexes = [models.Index(fields=["platform", "board_type", "observed_date"])]


class Snapshot(TimeStampedModel):
    platform = models.CharField(max_length=32)
    board_type = models.CharField(max_length=16)
    observed_date = models.DateField()
    source_type = models.CharField(max_length=24)
    authority_score = models.FloatField(default=0)
    entry_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=[("provisional", "暂定"), ("confirmed", "已确认")], default="provisional")

    class Meta:
        unique_together = [("platform", "board_type", "observed_date", "source_type")]


class Entry(TimeStampedModel):
    snapshot = models.ForeignKey(Snapshot, on_delete=models.CASCADE, related_name="entries")
    rank = models.PositiveSmallIntegerField()
    game = models.ForeignKey(Game, null=True, blank=True, on_delete=models.SET_NULL, related_name="entries")
    raw_name = models.CharField(max_length=128)
    trend = models.CharField(max_length=8, choices=[("up", "上升"), ("down", "下降"), ("new", "新进"), ("out", "掉榜"), ("flat", "持平")], default="flat")
    delta = models.IntegerField(null=True, blank=True)
    evidence_observation_ids = models.JSONField(default=list)

    class Meta:
        unique_together = [("snapshot", "rank")]
        ordering = ["rank"]


class Conflict(TimeStampedModel):
    subject_type = models.CharField(max_length=16)
    subject_id = models.BigIntegerField(null=True, blank=True)
    window_start = models.DateField(null=True, blank=True)
    window_end = models.DateField(null=True, blank=True)
    claim_ids = models.JSONField(default=list)
    conflict_type = models.CharField(max_length=16, choices=[("judgement", "观点"), ("ranking", "名次")])
    status = models.CharField(max_length=16, choices=[("open", "待处理"), ("resolved", "已核实"), ("kept", "保留分歧")], default="open")
    source = models.ForeignKey("content.Source", null=True, blank=True, on_delete=models.SET_NULL)
    article = models.ForeignKey("content.Article", null=True, blank=True, on_delete=models.SET_NULL)
    official_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    citation_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    platform = models.CharField(max_length=32, blank=True)
    board_type = models.CharField(max_length=16, blank=True)
    observed_date = models.DateField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    resolved_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL)
    resolved_at = models.DateTimeField(null=True, blank=True)
```

`Claim` 按 PRD §5.4，`subject_id` 用 `BigIntegerField(null=True)`。

将 `backend/apps/intel/models/__init__.py` 扩展为：

```python
from .catalog import Alias, Category, CategoryMapping, Game, GameTag, Tag
from .insight import Claim
from .ranking import Conflict, Entry, Observation, Snapshot

__all__ = [
    "Alias", "Category", "CategoryMapping", "Game", "GameTag", "Tag",
    "Claim", "Conflict", "Entry", "Observation", "Snapshot",
]
```

- [ ] **Step 2: 写 ParseBundle / ExtractionResult / 固定抽取器**

`bundle.py`：

```python
from dataclasses import dataclass, field

@dataclass
class RankingItem:
    rank: int
    name: str
    trend: str = "flat"
    delta: int | None = None

@dataclass
class RankingBlock:
    platform: str
    board_type: str
    observed_date: str
    source_type: str
    items: list[RankingItem] = field(default_factory=list)

@dataclass
class ClaimDraft:
    subject_type: str
    subject_name: str
    stance: str
    claim_text: str
    quote: str
    confidence: float

@dataclass
class ExtractionResult:
    rankings: list[RankingBlock] = field(default_factory=list)
    claims: list[ClaimDraft] = field(default_factory=list)
```

`extract.py` 提供 `FixtureExtractor`：返回固定的一条微信热门榜与一条观点，用于 Phase 1 联调；函数名 `extract_article(article)` 在 Phase 2 切换为 LLM 实现。

同时提供共享的引用校验：

```python
import re


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value or "")


def quote_in_text(quote: str, text: str) -> bool:
    return bool(quote) and normalize_text(quote) in normalize_text(text)
```

- [ ] **Step 3: 写全文投喂与管道**

`POST /api/ingest/fulltext`：

```python
payload = json.loads(request.body)
article = Article.objects.create(
    source_id=payload.get("source_id"),
    title=payload.get("title", "未命名文章"),
    raw_text=payload.get("text", ""),
    ingest_method=Article.Method.FULLTEXT,
    content_hash=content_hash(payload.get("text", "")),
    is_draft=False,
)
process_fulltext(article)
return ok(serialize_article(article), status=201)
```

> Phase 1 为最小闭环自动确认入库；Task 11 引入预览后，三通道统一改为 `is_draft=True`，由 `/api/ingest/confirm` 确认后再合并榜单。

`pipeline.py` 的 `process_fulltext`：

1. 校验正文非空。
2. 调用 `extract_article(article)`。
3. 删除该文章旧的 observations/claims。
4. 对每条 ranking item：`resolve_game(name)`；创建 Observation，`trend_raw=json.dumps({"trend":..., "delta":...})`。
5. 创建 Claim；校验 quote 是否为正文子串（规范化后），不通过则 `verify_status=pending` 且文章 `needs_review`。
6. 文章状态置为 `extracted` 或 `needs_review`。
7. 调用 `merge_day(platform, board, date)`。

`pipeline.py` 中必须实现以下 helper，避免未定义函数：

```python
import json
from datetime import date as date_cls

from apps.intel.models import Category, Claim, Observation
from apps.intel.services.catalog import resolve_game
from apps.intel.services.merge import merge_day
from apps.ingest.services.extract import quote_in_text


def resolve_subject_id(draft):
    if draft.subject_type == "game":
        game = resolve_game(draft.subject_name)
        return game.id if game else None
    if draft.subject_type == "category":
        category = Category.objects.filter(name=draft.subject_name).first()
        return category.id if category else None
    return None


def save_extraction(article, result):
    Observation.objects.filter(article=article).delete()
    Claim.objects.filter(article=article).delete()
    affected = set()
    for block in result.rankings:
        observed_date = date_cls.fromisoformat(block.observed_date)
        for item in block.items:
            game = resolve_game(item.name)
            Observation.objects.create(
                article=article,
                platform=block.platform,
                board_type=block.board_type,
                observed_date=observed_date,
                rank=item.rank,
                game=game,
                raw_game_name=item.name,
                trend_raw=json.dumps({"trend": item.trend, "delta": item.delta}),
                source_type=block.source_type,
                confidence=1,
            )
            affected.add((block.platform, block.board_type, observed_date))
    for draft in result.claims:
        verified = bool(draft.quote) and quote_in_text(draft.quote, article.raw_text) and draft.confidence >= 0.7
        Claim.objects.create(
            article=article,
            subject_type=draft.subject_type,
            subject_id=resolve_subject_id(draft),
            claim_text=draft.claim_text,
            stance=draft.stance,
            confidence=draft.confidence,
            quote=draft.quote,
            extracted_by="ai",
            verify_status="confirmed" if verified else "pending",
        )
    return affected


def article_needs_review(article):
    return article.claims.filter(verify_status="pending").exists()
```

- [ ] **Step 4: 写归并服务**

`merge_day`：

- 官方观测优先；无官方时用转述生成 `provisional` 快照。
- 删除旧 Entry 后重建；`trend`/`delta` 从 `trend_raw` JSON 读取。
- 对每条有 `game` 的转述观测，与官方 Entry 名次比较；不同则创建 `Conflict`（`conflict_type=ranking`、`status=open`、平台/榜种/日期、来源/文章、两排名）。
- 幂等：先删除该平台/榜种/日期的 ranking 冲突，再重建。

- [ ] **Step 5: 写榜单 API**

`GET /api/rankings?platform=&board=&date=` 返回：

```json
{
  "platform": "wechat_mini",
  "board": "hot",
  "date": "2026-10-16",
  "status": "confirmed",
  "official": {"source_label": "官方榜单", "entries": []},
  "citations": [{"source_name": "游戏葡萄", "article_id": 1, "captured_at": "...", "entries": []}],
  "conflicts": []
}
```

官方条目来自 Snapshot；转述条目从 Observation 按 `article/source` 分组。

- [ ] **Step 6: 写测试**

`test_ingest_fulltext.py` 覆盖：

- 全文投喂创建 Article、Observation、Snapshot、Entry、Claim。
- 重复 quote 不在正文时 Claim 为 pending，Article 为 needs_review。
- 榜单 API 返回 official/provisional 状态。
- `merge_day` 重复执行不会重复 Entry。

- [ ] **Step 7: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations intel
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py test apps.ingest apps.intel.tests.test_catalog -v 2
git add backend/apps/ingest backend/apps/intel backend/config/urls.py
git commit -m "feat: 全文投喂、固定抽取与榜单闭环"
```

---

### Task 7: 前端登录、榜单页与工作台最小版

**Files:**
- Modify: `frontend/src/views/LoginView.vue`
- Create: `frontend/src/views/RankingsView.vue`
- Create: `frontend/src/api/rankings.ts`
- Modify: `frontend/src/views/WorkbenchView.vue`
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: 登录页接入 Session**

按 Task 3 Step 5 实现；登录成功后 `router.replace('/')`。在 `App.vue` 或路由守卫中确保 `loadMe()` 已执行。

- [ ] **Step 2: 写榜单 API 与页面**

`api/rankings.ts`：

```ts
import { api } from './client'

export type RankingEntry = { rank: number; game_id: number | null; raw_name: string; trend: string; delta: number | null }
export type RankingResponse = {
  platform: string; board: string; date: string; status: 'confirmed' | 'provisional' | 'missing'
  official: { source_label: string; entries: RankingEntry[] } | null
  citations: { source_name: string; article_id: number; captured_at: string; entries: RankingEntry[] }[]
  conflicts: { id: number; game_id: number; official_rank: number; citation_rank: number; source_name: string; status: string }[]
}

export function fetchRankings(params: { platform: string; board: string; date: string }) {
  const query = new URLSearchParams(params).toString()
  return api<RankingResponse>(`/api/rankings?${query}`)
}
```

`RankingsView.vue` 用 `el-select`/`el-date-picker` 筛选，两列 `el-table` 展示官方与转述；状态为 `provisional` 时显示 `el-alert`「暂定快照，未经官方核对」。

- [ ] **Step 3: 工作台最小版**

`WorkbenchView.vue` 调用一个临时 `GET /api/articles?limit=5` 与 `/api/rankings`（默认微信热门），显示最近文章与榜单状态；待核/日报卡片先显示 0 或“Phase 3/5 接入”。

- [ ] **Step 4: 构建与手动验证**

```powershell
cd frontend
npm run build
npm run dev
```

手动路径：登录 → 工作台 → 榜单中心，切换微信/抖音与日期，确认空态与暂定提示正确。

- [ ] **Step 5: 提交并打 Phase 1 标签**

```powershell
git add frontend
git commit -m "feat: 登录、榜单中心与工作台最小闭环"
git tag phase-1
```

---

## 七、Phase 2：三通道投喂与后台任务

### Task 8: 进程内任务执行器、管道状态与重试

**Files:**
- Create: `backend/apps/core/tasks.py`
- Create: `backend/apps/core/tests/test_tasks.py`
- Modify: `backend/apps/ingest/services/pipeline.py`
- Create: `backend/apps/ingest/tests/test_pipeline_tasks.py`
- Modify: `backend/apps/ingest/api.py`
- Modify: `backend/apps/ingest/urls.py`

- [ ] **Step 1: 写任务执行器失败测试**

`core/tests/test_tasks.py`：

```python
from django.test import TestCase, override_settings

from apps.core.tasks import TaskRunner


class TaskRunnerTest(TestCase):
    @override_settings(TASKS_SYNC=True)
    def test_sync_mode_runs_inline(self):
        calls = []
        TaskRunner().submit(lambda: calls.append("ok"))
        self.assertEqual(calls, ["ok"])

    @override_settings(TASKS_SYNC=False, TASK_WORKERS=1)
    def test_async_mode_runs_function(self):
        from threading import Event
        done = Event()
        TaskRunner().submit(lambda: done.set())
        self.assertTrue(done.wait(timeout=2))
```

- [ ] **Step 2: 实现 TaskRunner**

`backend/apps/core/tasks.py`：

```python
import logging
from concurrent.futures import ThreadPoolExecutor

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)


class TaskRunner:
    def __init__(self):
        self._pool = None

    def _get_pool(self):
        if self._pool is None:
            self._pool = ThreadPoolExecutor(max_workers=settings.TASK_WORKERS, thread_name_prefix="ingest")
        return self._pool

    def submit(self, fn, *args, **kwargs):
        if settings.TASKS_SYNC:
            fn(*args, **kwargs)
            return

        def wrapped():
            try:
                fn(*args, **kwargs)
            except Exception:
                logger.exception("background task failed")
            finally:
                close_old_connections()

        self._get_pool().submit(wrapped)


runner = TaskRunner()
```

- [ ] **Step 3: 写管道失败/重试测试**

`ingest/tests/test_pipeline_tasks.py`：

```python
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from apps.accounts.models import UserProfile
from apps.content.models import Article
from apps.ingest.services.pipeline import process_article, retry_article


@override_settings(TASKS_SYNC=True)
class PipelineTaskTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="op", password="op123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()
        self.article = Article.objects.create(title="失败样本", raw_text="正文", ingest_method="fulltext", is_draft=True)

    @patch("apps.ingest.services.pipeline.extract_article", side_effect=RuntimeError("LLM 超时"))
    def test_failure_writes_reason(self, _):
        with self.assertRaises(RuntimeError):
            process_article(self.article.id)
        self.article.refresh_from_db()
        self.assertEqual(self.article.parse_status, Article.Status.FAILED)
        self.assertIn("LLM 超时", self.article.failure_reason)

    @patch("apps.ingest.services.pipeline.extract_article")
    def test_retry_resets_and_reruns(self, extract):
        extract.return_value = type("R", (), {"rankings": [], "claims": []})()
        self.article.parse_status = Article.Status.FAILED
        self.article.failure_reason = "old"
        self.article.save()
        retry_article(self.article.id)
        self.article.refresh_from_db()
        self.assertEqual(self.article.parse_status, Article.Status.EXTRACTED)
        self.assertEqual(self.article.failure_reason, "")
```

- [ ] **Step 4: 实现管道包装与重试 API**

`process_article` 成为唯一管道入口；Phase 1 的 `process_fulltext` 改为薄包装（`process_article(article.id)`）或删除，并同步更新测试，避免两套管道逻辑。

`pipeline.py` 增加：

```python
def process_article(article_id: int):
    article = Article.objects.get(id=article_id)
    try:
        article.parse_status = Article.Status.FETCHED if article.ingest_method == "link" else Article.Status.PARSED
        article.failure_reason = ""
        article.save(update_fields=["parse_status", "failure_reason", "updated_at"])

        result = extract_article(article)
        affected = save_extraction(article, result)
        article.parse_status = Article.Status.NEEDS_REVIEW if article_needs_review(article) else Article.Status.EXTRACTED
        article.save(update_fields=["parse_status", "updated_at"])
        if not article.is_draft:
            for platform, board, date in affected:
                merge_day(platform, board, date)
    except Exception as exc:
        article.parse_status = Article.Status.FAILED
        article.failure_reason = str(exc)[:2000]
        article.save(update_fields=["parse_status", "failure_reason", "updated_at"])
        raise


def retry_article(article_id: int):
    Article.objects.filter(id=article_id).update(parse_status=Article.Status.RECEIVED, failure_reason="")
    runner.submit(process_article, article_id)
```

`ingest/api.py` 增加：

```python
@role_required("operator", "admin")
@require_POST
def retry_article_view(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    retry_article(article.id)
    return ok({"id": article.id, "status": Article.Status.RECEIVED})
```

`ingest/urls.py` 增加：

```python
path("articles/<int:article_id>/retry", api.retry_article_view),
```

- [ ] **Step 5: 运行测试并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.core.tests.test_tasks apps.ingest.tests.test_pipeline_tasks -v 2
git add backend/apps/core/tasks.py backend/apps/core/tests/test_tasks.py backend/apps/ingest
git commit -m "feat: 进程内任务执行器与管道重试"
```

---

### Task 9: 链接投喂、正文抓取与双去重

**Files:**
- Create: `backend/apps/ingest/services/dedupe.py`
- Create: `backend/apps/ingest/services/fetch.py`
- Create: `backend/apps/ingest/tests/test_link_ingest.py`
- Modify: `backend/apps/ingest/api.py`
- Modify: `backend/apps/ingest/urls.py`

- [ ] **Step 1: 写去重与抓取测试**

`test_link_ingest.py`：

```python
from unittest.mock import patch

from django.test import TestCase, override_settings

from apps.content.models import Article, Source
from apps.ingest.services.dedupe import content_hash, find_duplicate
from apps.ingest.services.fetch import FetchResult


@override_settings(TASKS_SYNC=True)
class LinkIngestTest(TestCase):
    def setUp(self):
        self.source = Source.objects.create(name="游戏葡萄", platforms=["wechat_mini"], weight=5)

    def test_content_hash_ignores_whitespace(self):
        self.assertEqual(content_hash("抓大鹅 重回 第一"), content_hash("抓大鹅重回第一"))

    def test_url_duplicate(self):
        Article.objects.create(title="旧文", url="https://example.com/a", ingest_method="link", is_draft=False)
        self.assertIsNotNone(find_duplicate(url="https://example.com/a"))

    @patch("apps.ingest.api.fetch_article")
    def test_link_ingest_creates_draft_and_skips_duplicate(self, fetch):
        fetch.return_value = FetchResult(title="抓大鹅重回第一", text="正文内容", html="<html/>")
        response = self.client.post(
            "/api/ingest/link",
            data={"urls": ["https://example.com/a", "https://example.com/a"], "source_id": self.source.id},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()["data"]
        self.assertEqual(len(body["articles"]), 1)
        self.assertTrue(body["articles"][0]["duplicate"] is False)
        self.assertTrue(Article.objects.filter(url="https://example.com/a", is_draft=True).exists())
```

- [ ] **Step 2: 实现去重**

`dedupe.py`：

```python
import hashlib
import re

from apps.content.models import Article


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value or "")


def content_hash(value: str) -> str:
    return hashlib.sha256(normalize_text(value).encode("utf-8")).hexdigest()


def find_duplicate(url: str | None = None, text: str | None = None, exclude_id: int | None = None):
    qs = Article.objects.all()
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    if url:
        found = qs.filter(url=url).first()
        if found:
            return found
    if text:
        found = qs.filter(content_hash=content_hash(text)).first()
        if found:
            return found
    return None
```

- [ ] **Step 3: 实现抓取**

`fetch.py`：

```python
from dataclasses import dataclass

import requests
import trafilatura


@dataclass
class FetchResult:
    title: str
    text: str
    html: str


class FetchError(RuntimeError):
    pass


def fetch_article(url: str) -> FetchResult:
    try:
        response = requests.get(url, timeout=20, headers={"User-Agent": "RankingIntel/1.0"})
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FetchError(f"抓取失败：{exc}") from exc
    html = response.text
    text = trafilatura.extract(html) or ""
    metadata = trafilatura.extract_metadata(html)
    title = metadata.title if metadata and metadata.title else url
    if not text.strip():
        raise FetchError("未提取到有效正文")
    return FetchResult(title=title, text=text, html=html)
```

- [ ] **Step 4: 实现链接投喂 API**

`POST /api/ingest/link` 请求体：

```json
{"urls": ["https://mp.weixin.qq.com/s/..."], "source_id": 1}
```

处理逻辑：

1. `urls` 去空、去重，最多 20 条。
2. 对每条 URL：
   - `find_duplicate(url=url)`；命中则返回 `{"url":..., "duplicate": true, "article_id": found.id}`。
   - 否则创建 `Article(title=url, url=url, source_id=..., ingest_method="link", is_draft=True)`。
   - 调 `fetch_article(url)`；成功则写 `title/raw_text/raw_html/fetched_at`，`content_hash`；失败则写 `parse_status=failed`、`failure_reason`。
   - 成功且非重复时 `runner.submit(process_article, article.id)`。
3. 返回 `{"articles": [...]}`，状态码 201。

注意：抓取在请求内完成（保证预览标题可用）；LLM/OCR 在后台完成。若希望抓取也后台化，可在 Phase 2 之后优化，但不改变 API。

- [ ] **Step 5: 运行测试并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.ingest.tests.test_link_ingest -v 2
git add backend/apps/ingest
git commit -m "feat: 链接投喂、正文抓取与去重"
```

---

### Task 10: 截图上传与 RapidOCR 适配器

**Files:**
- Create: `backend/apps/ingest/services/ocr.py`
- Create: `backend/apps/ingest/tests/test_screenshot_ingest.py`
- Modify: `backend/apps/ingest/api.py`
- Modify: `backend/apps/ingest/urls.py`

- [ ] **Step 1: 写 OCR 适配器**

`backend/apps/ingest/services/ocr.py`：

```python
from dataclasses import dataclass, field

from django.conf import settings


@dataclass
class OcrResult:
    text: str = ""
    confidence: float = 0.0
    lines: list[str] = field(default_factory=list)


def ocr_image(path: str) -> OcrResult:
    if not settings.OCR_ENABLED:
        return OcrResult()
    from rapidocr_onnxruntime import RapidOCR

    engine = RapidOCR()
    result, _ = engine(path)
    if not result:
        return OcrResult()
    lines = [item[1] for item in result]
    scores = [float(item[2]) for item in result if len(item) > 2]
    return OcrResult(text="\n".join(lines), confidence=sum(scores) / len(scores) if scores else 0.0, lines=lines)
```

- [ ] **Step 2: 写截图接口**

`POST /api/ingest/screenshot`（multipart）：

字段：`file`、`source_id`（可选）、`title`（可选）。

逻辑：

1. 创建 `Article(title=..., ingest_method="screenshot", is_draft=True)`。
2. 创建 `Asset(article, type=screenshot, file=file)`。
3. 调 `ocr_image(asset.file.path)`，写 `ocr_text`、`ocr_confidence`。
4. 把 OCR 文本写入 `article.raw_text`，文章状态置 `parsed`。
5. 若 OCR 文本为空，文章 `failed` + `failure_reason`。
6. 否则 `runner.submit(process_article, article.id)`，返回文章 id/status。

- [ ] **Step 3: 写测试**

`test_screenshot_ingest.py` 使用 `SimpleUploadedFile` 上传 1x1 PNG，`patch("apps.ingest.api.ocr_image")` 返回 `OcrResult(text="1 抓大鹅", confidence=0.86)`；断言 Article/Asset 创建、`ocr_confidence` 保存、任务被提交（`TASKS_SYNC=True` 时直接执行，但可 patch `process_article` 验证调用）。

- [ ] **Step 4: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.ingest.tests.test_screenshot_ingest -v 2
git add backend/apps/ingest
git commit -m "feat: 截图投喂与 RapidOCR 适配器"
```

---

### Task 11: LLM 抽取、引用校验、预览确认与投喂台页面

**Files:**
- Create: `backend/apps/ingest/services/llm.py`
- Modify: `backend/apps/ingest/services/extract.py`
- Create: `backend/apps/ingest/tests/test_llm_extract.py`
- Modify: `backend/apps/ingest/api.py`
- Modify: `backend/apps/ingest/urls.py`
- Create: `frontend/src/api/ingest.ts`
- Modify: `frontend/src/views/IngestView.vue`
- Modify: `frontend/src/views/WorkbenchView.vue`

- [ ] **Step 1: 写 LLM 客户端**

`llm.py`：

```python
import json

import requests
from django.conf import settings


class LLMError(RuntimeError):
    pass


def complete_json(system_prompt: str, user_prompt: str) -> dict:
    if not settings.LLM_BASE_URL or not settings.LLM_API_KEY:
        raise LLMError("未配置 LLM_BASE_URL / LLM_API_KEY")
    url = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {settings.LLM_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": settings.LLM_MODEL,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=settings.LLM_TIMEOUT,
    )
    if response.status_code >= 400:
        raise LLMError(f"LLM 调用失败：{response.status_code} {response.text[:300]}")
    content = response.json()["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMError("LLM 返回不是合法 JSON") from exc
```

- [ ] **Step 2: 实现 LLM 抽取与引用校验**

`extract.py` 增加 `LLMExtractor`：
- System prompt 要求只输出 JSON，字段与 PRD §6.4 一致。
- 用户内容包含标题、正文；正文截断到 12000 字。
- 将 JSON 转为 `ExtractionResult`。
- 每条 claim 的 quote 复用 Task 6 已定义的 `quote_in_text(quote, text)` 做规范化子串校验，不重复定义。
- 无 quote 或 quote 不在正文：`verify_status=pending`，文章 `needs_review`。
- 低置信度 `< 0.7`：同样 `pending`。

`extract_article(article)`：
```python
if settings.LLM_API_KEY:
    return LLMExtractor().extract(article)
return FixtureExtractor().extract(article)
```

Fixture 仅用于本地无 Key 时打通流程，日志必须输出 `WARNING: using fixture extractor`，不得作为生产默认。

- [ ] **Step 3: 写 LLM 抽取测试**

`test_llm_extract.py`：
- patch `complete_json` 返回一条 ranking + 一条 claim。
- 断言 Observation/Claim 创建、quote 命中。
- 篡改 quote，断言 Claim pending、Article needs_review。
- 低置信度 claim 断言 pending。

- [ ] **Step 4: 实现任务状态与预览确认 API**

先把 Task 6 的全文档投喂创建改为 `is_draft=True`，与链接、截图通道一致；三通道统一由确认接口触发 `merge_day`。

新增：

- `GET /api/ingest/tasks?ids=1,2,3`：返回每篇 `id,title,status,obs_count,claim_count,duplicate,is_draft`。
- `POST /api/ingest/confirm` `{ids:[...]}`：仅对 `is_draft=True` 的文章生效；设置 `is_draft=False`、`confirmed_at=now`；对每篇观测涉及的 `(platform, board, date)` 调 `merge_day`。
- `POST /api/ingest/cancel` `{ids:[...]}`：删除 draft 文章（级联 Asset/Observation/Claim）。

测试：确认后 `is_draft=False` 且 Snapshot 可查；取消后 Article 不存在。

- [ ] **Step 5: 实现投喂台页面**

`frontend/src/api/ingest.ts` 封装：

```ts
export function submitLink(payload: { urls: string[]; source_id?: number }) {
  return api<{ articles: IngestArticle[] }>('/api/ingest/link', { method: 'POST', body: JSON.stringify(payload) })
}
export function submitFulltext(payload: { title: string; text: string; source_id?: number }) {
  return api<{ articles: IngestArticle[] }>('/api/ingest/fulltext', { method: 'POST', body: JSON.stringify(payload) })
}
export function submitScreenshot(form: FormData) {
  return api<{ articles: IngestArticle[] }>('/api/ingest/screenshot', { method: 'POST', body: form })
}
export function pollTasks(ids: number[]) { return api<IngestArticle[]>(`/api/ingest/tasks?ids=${ids.join(',')}`) }
export function confirmTasks(ids: number[]) { return api('/api/ingest/confirm', { method: 'POST', body: JSON.stringify({ ids }) }) }
export function cancelTasks(ids: number[]) { return api('/api/ingest/cancel', { method: 'POST', body: JSON.stringify({ ids }) }) }
```

`IngestView.vue`：

- `el-tabs` 三通道：链接、截图、全文。
- 来源 `el-select` 从 `/api/sources` 读取。
- 提交后保存任务 id，`setInterval` 每 1.5s 轮询；全部结束或失败后停止。
- 结果区 `el-table`：标题、来源、状态、观测数、观点数、操作（查看/重试）。
- 预览 `el-drawer`：已选任务标题、来源、数量、重复标记；按钮“确认入库 / 取消”。不展示正文/候选/修正（待确认范围）。
- 失败任务显示“重试”与“转全文”（跳转全文 Tab 并预填标题）。

- [ ] **Step 6: 构建、手动验证与提交**

```powershell
cd frontend
npm run build
cd ../backend
.\.venv\Scripts\python.exe manage.py test apps.ingest -v 2
git add backend/apps/ingest frontend/src
git commit -m "feat: 三通道投喂、LLM 抽取与预览确认"
git tag phase-2
```

手动验证：链接、全文、截图各投喂一次；确认预览出现；确认后榜单可查；取消后文章不进入榜单；重启服务后数据仍在。

---

## 八、Phase 3：榜单归并、差异与待核

### Task 12: 官方/转述归并、暂定快照与差异生成

**Files:**
- Modify: `backend/apps/intel/services/merge.py`
- Create: `backend/apps/intel/tests/test_merge.py`
- Modify: `backend/apps/intel/api/rankings.py`

- [ ] **Step 1: 写归并测试**

覆盖：

1. 只有转述：生成 `provisional` Snapshot，`status=provisional`。
2. 官方 + 转述：官方为基准，转述名次不同生成 `open` ranking Conflict。
3. 重复来源同一名次：Entry 不重复计数。
4. 重复调用 `merge_day`：Entry/Conflict 不重复。

测试构造 Observation：

```python
Observation.objects.create(platform="wechat_mini", board_type="hot", observed_date=date, rank=1, raw_game_name="抓大鹅", source_type="official_original", confidence=1)
Observation.objects.create(platform="wechat_mini", board_type="hot", observed_date=date, rank=2, raw_game_name="抓大鹅", source_type="article_citation", article=article, confidence=0.9)
```

- [ ] **Step 2: 实现完整归并**

`merge.py` 核心：

```python
def merge_day(platform: str, board: str, date):
    observations = list(
        Observation.objects.filter(platform=platform, board_type=board, observed_date=date)
        .select_related("game", "article", "article__source")
        .order_by("rank", "id")
    )
    official = [o for o in observations if o.source_type == "official_original"]
    if official:
        source_type, status, authority, basis = "official_original", "confirmed", 1.0, official
    else:
        source_type, status, authority, basis = "article_citation", "provisional", 0.5, observations

    snapshot, _ = Snapshot.objects.update_or_create(
        platform=platform, board_type=board, observed_date=date, source_type=source_type,
        defaults={"status": status, "authority_score": authority, "entry_count": len(basis)},
    )
    snapshot.entries.all().delete()
    seen = set()
    for obs in basis:
        key = ("game", obs.game_id) if obs.game_id else ("raw", normalize_name(obs.raw_game_name))
        if key in seen:
            continue
        seen.add(key)
        trend, delta = parse_trend_raw(obs.trend_raw)
        Entry.objects.create(
            snapshot=snapshot, rank=obs.rank, game=obs.game, raw_name=obs.raw_game_name,
            trend=trend, delta=delta, evidence_observation_ids=[obs.id],
        )

    existing_conflicts = {
        (c.subject_id, c.source_id, c.article_id): c
        for c in Conflict.objects.filter(
            conflict_type="ranking", platform=platform, board_type=board, observed_date=date
        )
    }
    keep_keys = set()
    if official:
        official_ranks = {e.game_id: e.rank for e in snapshot.entries.all() if e.game_id}
        for obs in observations:
            if obs.source_type != "article_citation" or not obs.game_id:
                continue
            official_rank = official_ranks.get(obs.game_id)
            if not official_rank or official_rank == obs.rank:
                continue
            key = (obs.game_id, obs.article.source_id if obs.article else None, obs.article_id)
            if key in keep_keys:
                continue
            keep_keys.add(key)
            existing = existing_conflicts.get(key)
            if existing:
                if existing.official_rank != official_rank or existing.citation_rank != obs.rank:
                    existing.official_rank = official_rank
                    existing.citation_rank = obs.rank
                    existing.status = "open"
                    existing.resolution_note = ""
                    existing.resolved_by = None
                    existing.resolved_at = None
                    existing.save()
            else:
                Conflict.objects.create(
                    subject_type="game", subject_id=obs.game_id, conflict_type="ranking", status="open",
                    source=obs.article.source if obs.article else None, article=obs.article,
                    official_rank=official_rank, citation_rank=obs.rank,
                    platform=platform, board_type=board, observed_date=date,
                    window_start=date, window_end=date,
                )
    for key, conflict in existing_conflicts.items():
        if key not in keep_keys:
            conflict.delete()
    return snapshot
```

归并必须**保留已处理结论**：名次未变化时不重置 `resolved/kept` 与备注；名次变化时才重新打开并清空结论；不再存在差异的冲突删除。

`parse_trend_raw` 读取 JSON；失败返回 `("flat", None)`。

当官方基准存在时，同时删除同平台/榜种/日期的 provisional Snapshot，避免榜单 API 读到旧暂定快照。

- [ ] **Step 3: 扩展榜单 API**

`GET /api/rankings?platform=&board=&date=`：

- 取官方 Snapshot；若不存在，取 provisional。
- official entries 序列化游戏名、品类 L2、trend/delta。
- citations：按 `Observation` 的 `article/source` 分组，只返回有文章的转述；每条附 `diff = rank - official_rank`。
- conflicts：返回当前平台/榜种/日期的 open/resolved/kept。
- 状态为 missing 时返回 `official=null, citations=[], conflicts=[]`。

- [ ] **Step 4: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_merge -v 2
git add backend/apps/intel
git commit -m "feat: 榜单归并、暂定快照与差异生成"
```

---

### Task 13: 差异证据、结论记录与榜单中心完整页

**Files:**
- Modify: `backend/apps/intel/api/rankings.py`
- Modify: `backend/apps/intel/urls.py`
- Create: `backend/apps/intel/tests/test_conflicts.py`
- Modify: `frontend/src/api/rankings.ts`
- Modify: `frontend/src/views/RankingsView.vue`

- [ ] **Step 1: 写结论 API 测试**

- `POST /api/conflicts/<id>/resolve` `{status:"resolved"|"kept", note:"..."}`：
  - 仅 operator/admin。
  - 写 `status/resolution_note/resolved_by/resolved_at`。
  - `resolved` 与 `kept` 都不再计入 open 数量。
- 重复 resolve 已关闭的 conflict 返回 409。

- [ ] **Step 2: 实现 API**

`GET /api/rankings/evidence?platform=&board=&date=&game_id=` 返回该游戏的官方名次、各来源名次、差异、相关 Claim 与原文链接，供差异抽屉使用。

```python
@role_required("operator", "admin")
@require_POST
def resolve_conflict(request, conflict_id):
    payload = json.loads(request.body or "{}")
    status = payload.get("status")
    if status not in {"resolved", "kept"}:
        return fail("invalid_status", "结论只能是 resolved 或 kept", 400)
    with transaction.atomic():
        conflict = get_object_or_404(Conflict.objects.select_for_update(), id=conflict_id)
        if conflict.status != "open":
            return fail("already_resolved", "该差异已处理", 409)
        conflict.status = status
        conflict.resolution_note = (payload.get("note") or "").strip()
        conflict.resolved_by = request.user
        conflict.resolved_at = timezone.now()
        conflict.save()
    return ok({"id": conflict.id, "status": conflict.status, "note": conflict.resolution_note})
```

- [ ] **Step 3: 实现榜单中心页面**

`RankingsView.vue` 使用 `el-radio-group` 平台、`el-select` 榜种、`el-date-picker` 日期、`el-button` 查询。

页面结构：

- 顶部状态：已确认/暂定/无数据；差异数。
- 两列卡片：官方基准、公众号转述（来源 `el-tabs`）。
- 差异行加 `row-class-name` 标红。
- 点击行打开 `el-drawer`：官方名次、各来源名次、相关观点、结论备注、按钮“标记已核实 / 保留分歧”。
- `lead` 角色隐藏结论按钮；`operator/admin` 可提交。

- [ ] **Step 4: 构建、测试与提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_conflicts -v 2
cd frontend
npm run build
git add backend/apps/intel frontend/src
git commit -m "feat: 差异证据与结论记录"
```

---

### Task 14: 待核队列 API 与页面

**Files:**
- Create: `backend/apps/intel/services/review.py`
- Create: `backend/apps/intel/api/review.py`
- Create: `backend/apps/intel/tests/test_review.py`
- Modify: `backend/apps/intel/urls.py`
- Create: `frontend/src/api/review.ts`
- Modify: `frontend/src/views/ReviewView.vue`

- [ ] **Step 1: 写待核查询服务**

`review.py`：

```python
def summary():
    return {
        "mapping": Observation.objects.filter(game__isnull=True, article__is_draft=False).count(),
        "category": Game.objects.filter(category__isnull=True).count()
                    + Game.objects.filter(category__level=2).count(),
        "claims": Claim.objects.filter(verify_status="pending").count(),
        "errors": Article.objects.filter(parse_status__in=["failed", "needs_review"]).count(),
    }
```

列表查询：

- 映射：`Observation.objects.filter(game__isnull=True).select_related("article__source")`，返回原文名称、平台/榜次、来源文章、置信度。
- 品类：`Game` 无品类或 `category.level=2`。
- 观点：`Claim` pending，附 quote/source。
- 异常：Article failed/needs_review，附失败原因。

所有待核查询必须排除 `Article.is_draft=True` 的预览文章。

- [ ] **Step 2: 写映射与品类 API**

`POST /api/review/observations/<id>/map`：

```json
{"game_id": 3}
```

或：

```json
{"new_game_name": "猪猪侠快跑", "category_id": 12}
```

逻辑：

1. 校验 observation 存在。
2. 选择已有 game 或创建新 game（`canonical_name`，category 可空）。
3. 若 `raw_game_name` 与 canonical 不同，`Alias.objects.get_or_create`，写来源/确认人/时间。
4. 写 `observation.game`。
5. 调 `merge_day(observation.platform, observation.board_type, observation.observed_date)`。
6. 返回 game id。

`POST /api/review/games/<id>/category`：

```json
{"category_id": 12}
```

校验 Category 层级为 L2/L3；写 `game.category`、`category_source=human`、`category_confidence=1`；移除 `L3 品类待补` 质量标记。

`POST /api/review/claims/<id>/verify`：

```json
{"status": "confirmed" | "disputed"}
```

`POST /api/review/articles/<id>/retry`：调用 `retry_article`。

- [ ] **Step 3: 写测试**

覆盖：

- summary 计数正确。
- 映射已有游戏：Observation.game 写入、Alias 创建、Entry 重建。
- 新建游戏并映射。
- 品类补全：L3 写入、质量标记移除。
- Claim 确认/分歧。
- 重试失败文章。

- [ ] **Step 4: 实现待核页面**

`ReviewView.vue`：

- `el-tabs` 四个标签，标签上显示计数。
- 映射表格：原始名称、平台/榜次、来源、建议/置信度、按钮“映射”。
- 映射弹窗：`el-radio-group` 选择已有/新建；已有用 `el-select` 搜索；新建填写主名与 L1/L2/L3。
- 品类弹窗：三级联动 `el-select`，保存调 category API。
- 观点卡片：quote 高亮，按钮“确认观点 / 标记分歧”。
- 异常表格：重试、转全文（跳转 `/ingest` 并预填标题）。

- [ ] **Step 5: 运行、构建、提交并打标签**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_review -v 2
cd frontend
npm run build
git add backend/apps/intel frontend/src
git commit -m "feat: 待核队列与处理闭环"
```

手动验证：投喂一篇含未映射游戏的文章 → 待核映射 → 榜单出现该游戏 → 差异抽屉记录结论 → 待核计数下降。

---

### Task 14b: 文章详情与素材溯源页

**Files:**
- Modify: `backend/apps/content/api.py`
- Create: `backend/apps/content/tests/test_article_detail.py`
- Create: `frontend/src/views/ArticleView.vue`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: 写文章详情 API 测试**

`GET /api/articles/<id>` 返回：

```json
{
  "id": 1,
  "title": "抓大鹅重回第一",
  "source": {"id": 1, "name": "游戏葡萄"},
  "published_at": "2026-10-16T08:12:00+08:00",
  "ingest_method": "link",
  "parse_status": "extracted",
  "failure_reason": "",
  "content_hash": "…",
  "raw_text": "正文…",
  "assets": [{"id": 1, "type": "screenshot", "url": "/media/assets/...", "ocr_confidence": 0.86}],
  "observations": [{"id": 1, "platform": "wechat_mini", "board_type": "hot", "rank": 1, "raw_game_name": "抓大鹅", "source_type": "article_citation"}],
  "claims": [{"id": 1, "claim_text": "...", "quote": "...", "stance": "positive", "verify_status": "confirmed"}]
}
```

测试断言未登录 401、不存在 404、返回观测/观点/素材。

- [ ] **Step 2: 实现文章详情页**

`ArticleView.vue`：

- 顶部返回、标题、来源、发布时间、投喂方式、状态标签。
- 管道步骤条：接收 → 抓取 → 解析 → 去重 → 抽取 → 归类 → 待核 → 发布；根据 `parse_status` 标记已完成/当前。
- 失败时显示 `el-alert` 与“重试解析”（operator/admin）。
- 正文卡片；截图素材卡片（OCR 置信度与识别的榜单行）；观测表；观点引用卡片。
- 所有结论提供来源链接（返回本页即可）。

- [ ] **Step 3: 构建、测试、提交并打标签**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.content.tests.test_article_detail -v 2
cd frontend
npm run build
git add backend/apps/content frontend/src
git commit -m "feat: 文章详情与素材溯源页"
git tag phase-3
```

手动验证：从榜单证据、待核异常、游戏素材溯源三个入口进入文章详情，正文/截图/观测/观点均可见。

---

## 九、Phase 4：品类、游戏库与档案

### Task 15: 品类维护、游戏编辑与别名管理

**Files:**
- Modify: `backend/apps/intel/api/categories.py`
- Modify: `backend/apps/intel/api/games.py`
- Create: `backend/apps/intel/tests/test_catalog_admin.py`
- Create: `backend/apps/core/audit.py`
- Modify: `backend/apps/intel/urls.py`

- [ ] **Step 1: 写审计与品类校验测试**

覆盖：

- 创建 L1/L2/L3 成功；L4 返回 400；L2 挂 L3 返回 400。
- 非管理员创建品类 403。
- 游戏编辑基础身份与品类成功。
- 新增别名后 `resolve_game` 命中。
- 审计日志写入。

- [ ] **Step 2: 实现审计 helper**

`backend/apps/core/audit.py`：

```python
from apps.core.models import AuditLog


def log_action(actor, action, entity, before=None, after=None):
    AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=str(entity.pk),
        before=before or {},
        after=after or {},
    )
```

- [ ] **Step 3: 实现品类与游戏编辑 API**

`POST /api/categories`（admin）：

```json
{"parent_id": null, "name": "休闲益智"}
```

- `level` 由 parent 推导：无 parent=1；parent_level+1；超过 3 返回 400。
- 同一 parent 下重名 409。

`PATCH /api/games/<id>`（operator/admin）：

```json
{
  "canonical_name": "抓大鹅",
  "publisher": "疯狂游戏",
  "developer": "疯狂游戏",
  "release_date": "2025-09-18",
  "online_status": "运营中",
  "has_isbn": false,
  "category_id": 12,
  "aliases": ["抓大鹅正版"]
}
```

- `category_id` 必须是 L2 或 L3；L1 返回 400。
- 写 `category_source=human`、`category_confidence=1`。
- 别名 `get_or_create`，写 `confirmed_by=request.user`。
- 调 `log_action`。

`GET /api/categories/tree` 已存在；补充 `GET /api/categories?level=` 供下拉选择。

- [ ] **Step 4: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_catalog_admin -v 2
git add backend/apps/intel backend/apps/core/audit.py
git commit -m "feat: 品类维护、游戏编辑与别名管理"
```

---

### Task 16: 游戏库查询与七维档案聚合

**Files:**
- Modify: `backend/apps/intel/services/catalog.py`
- Modify: `backend/apps/intel/api/games.py`
- Create: `backend/apps/intel/tests/test_game_profile.py`

- [ ] **Step 1: 写档案聚合测试**

准备 3 天 Snapshot/Entry，断言：

- `current_rank` 取最近日期。
- `best_rank` 取历史最小。
- `days_on_board` 为不同日期数。
- `streak` 为连续在榜天数。
- `history` 返回最近 7 天。
- `claims` 包含该游戏观点。
- `sources` 包含引用文章。
- `aliases` 与 `quality_flags` 返回。

- [ ] **Step 2: 实现档案聚合**

`services/catalog.py` 增加：

```python
def game_profile(game):
    entries = list(
        Entry.objects.filter(game=game)
        .select_related("snapshot")
        .order_by("-snapshot__observed_date", "rank")
    )
    dates = sorted({e.snapshot.observed_date for e in entries}, reverse=True)
    current = entries[0] if entries else None
    best = min((e.rank for e in entries), default=None)
    streak = 0
    for i, date in enumerate(dates):
        if i == 0 or (dates[i - 1] - date).days == 1:
            streak += 1
        else:
            break
    claims = Claim.objects.filter(subject_type="game", subject_id=game.id).select_related("article__source")
    observations = Observation.objects.filter(game=game).select_related("article__source")
    source_ids = sorted({o.article.source_id for o in observations if o.article and o.article.source_id})
    return {
        "game": serialize_game(game),
        "stats": {
            "current_rank": current.rank if current else None,
            "best_rank": best,
            "days_on_board": len(dates),
            "streak": streak,
        },
        "history": [serialize_entry(e) for e in entries[:7]],
        "claims": [serialize_claim(c) for c in claims],
        "aliases": [{"alias": a.alias, "type": a.alias_type, "source": a.source.name if a.source else ""} for a in game.aliases.select_related("source")],
        "sources": list(Source.objects.filter(id__in=source_ids).values("id", "name")),
        "quality_flags": game.quality_flags,
    }
```

- [ ] **Step 3: 实现 API**

- `GET /api/games?q=&platform=&category=&limit=`：搜索主名/别名/发行商，按最近在榜排序。
- `GET /api/games/<id>`：返回档案聚合。
- `GET /api/games/<id>/claims`：观点档案分页（MVP 返回全部）。
- `GET /api/games/<id>/sources`：关联文章与截图。

- [ ] **Step 4: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_game_profile -v 2
git add backend/apps/intel
git commit -m "feat: 游戏库与七维档案聚合"
```

---

### Task 17: 游戏库与游戏档案页面

**Files:**
- Create: `frontend/src/api/catalog.ts`
- Modify: `frontend/src/views/GamesView.vue`
- Modify: `frontend/src/views/GameProfileView.vue`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: 实现游戏库页面**

`GamesView.vue`：

- 搜索框、平台筛选、L1 品类筛选。
- `el-table` 列：游戏、品类路径、平台、当前名次、历史最佳、在榜天数、数据质量。
- 点击行跳转 `/games/:id`。
- 空态与加载态。

- [ ] **Step 2: 实现游戏档案页面**

`GameProfileView.vue`：

- 顶部：游戏名、别名、平台、品类路径、质量标签、编辑按钮（lead 隐藏）。
- 四个统计卡：当前名次、历史最佳、在榜天数、连续在榜。
- `el-tabs`：概览、榜单履历、观点档案、素材溯源。
- 概览：基础身份、品类与标签、别名表、数据质量。
- 履历：表格展示日期/平台/榜种/名次/变化/来源类型。
- 观点：quote + stance + verify_status + 来源链接。
- 溯源：文章/截图列表，跳转 `/articles/:id`。
- 编辑 `el-dialog`：基础身份与三级品类；保存后刷新。

- [ ] **Step 3: 构建、手动验证、提交并打标签**

```powershell
cd frontend
npm run build
cd ../backend
.\.venv\Scripts\python.exe manage.py test apps.intel -v 2
git add frontend/src
git commit -m "feat: 游戏库与游戏档案页面"
git tag phase-4
```

手动验证：搜索游戏、筛选品类、打开档案、编辑品类与别名、刷新后数据仍在。

---

## 十、Phase 5：日报生成、编辑、定稿与导出

### Task 18: 日报模型与初稿生成

**Files:**
- Modify: `backend/apps/digest/apps.py`
- Create: `backend/apps/digest/models.py`
- Create: `backend/apps/digest/services.py`
- Create: `backend/apps/digest/tests/test_generate.py`
- Modify: `backend/config/settings.py`（已包含 app）

- [ ] **Step 1: 写模型**

`backend/apps/digest/models.py`：

```python
from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Digest(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "草稿"
        REVIEWED = "reviewed", "已定稿"
        PUBLISHED = "published", "已发布"

    digest_date = models.DateField(unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    generated_at = models.DateTimeField()
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    version = models.PositiveIntegerField(default=1)


class DigestItem(TimeStampedModel):
    class Section(models.TextChoices):
        OVERVIEW = "overview", "今日概览"
        WECHAT = "wechat", "微信小游戏榜"
        DOUYIN = "douyin", "抖音小游戏榜"
        CATEGORY = "category", "品类动态"
        CLAIMS = "claims", "值得关注的观点"
        PENDING = "pending", "待核实事项"

    class RefType(models.TextChoices):
        SNAPSHOT = "snapshot", "快照"
        CLAIM = "claim", "观点"
        CONFLICT = "conflict", "分歧"
        REVIEW = "review", "待核"

    digest = models.ForeignKey(Digest, on_delete=models.CASCADE, related_name="items")
    section = models.CharField(max_length=16, choices=Section.choices)
    order = models.PositiveIntegerField(default=0)
    ref_type = models.CharField(max_length=16, choices=RefType.choices)
    ref_id = models.CharField(max_length=64)
    generated_text = models.TextField()
    is_included = models.BooleanField(default=True)
    text_override = models.TextField(blank=True)
    editor_note = models.TextField(blank=True)

    class Meta:
        ordering = ["section", "order", "id"]
```

- [ ] **Step 2: 写生成测试**

覆盖：

- 生成后 Digest 为 draft，包含 overview/wechat/douyin/category/claims/pending 六类条目。
- 官方快照优先；无官方时使用 provisional，并在条目中标注“未经官方核对”。
- 重复生成草稿会替换旧条目，不产生重复。
- 已定稿再次生成返回 409。
- 每个条目 `ref_type/ref_id` 可回溯。

- [ ] **Step 3: 实现生成服务**

`services.generate_digest(date, actor)`：

1. 若已有 reviewed Digest，抛 `DigestLocked`。
2. 取当天微信/抖音官方或 provisional Snapshot；无快照则返回空日报（仍创建 draft）。
3. 取前一天同平台/榜种 Snapshot，计算：
   - 新进：当前有、前一天无。
   - 掉榜：前一天有、当前无。
   - 名次跃迁：`abs(delta) >= 5`。
4. 生成 overview（最多 5 条）与平台条目。
5. 品类动态：按 L1/L2 统计当前与前一天上榜数量，输出变化最大的 2 条。
6. 观点：取异动游戏的 Claim，按 `source.weight` 与 `created_at` 排序，最多 3 条；如有关联 open/kept Conflict，增加 1 条。
7. 待核实：review.summary 中非零项 + 未核对 provisional 快照。
8. `Digest.objects.update_or_create`，删除旧 items，按 section/order 创建 `DigestItem`，`generated_text` 为自动文本，`is_included=True`。

文本示例：

```python
f"《{game_name}》升至第 {rank}（{delta:+d}）。"
f"《{game_name}》新进第 {rank}。"
f"《{game_name}》掉出前 {limit}。"
```

- [ ] **Step 4: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py makemigrations digest
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py test apps.digest.tests.test_generate -v 2
git add backend/apps/digest
git commit -m "feat: 日报模型与初稿生成"
```

---

### Task 19: 日报编辑、定稿与 Markdown 导出

**Files:**
- Create: `backend/apps/digest/api.py`
- Create: `backend/apps/digest/urls.py`
- Create: `backend/apps/digest/tests/test_editor.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 写编辑与锁定测试**

覆盖：

- `GET /api/digests/<date>` 返回分组条目。
- 草稿态可 PATCH `is_included/text_override/editor_note`。
- 草稿态可重排、删除。
- 定稿后 PATCH/重排/删除返回 409。
- 定稿后导出 Markdown 包含标题、日期、章节、来源。
- 未勾选任何条目时定稿返回 400。

- [ ] **Step 2: 实现 API**

- `GET /api/digests/<date>`：不存在返回 404。
- `PATCH /api/digest-items/<id>`：
  ```json
  {"is_included": true, "text_override": "人工改写内容", "editor_note": "备注"}
  ```
  仅 draft；`text_override` 为空时回退 `generated_text`。
- `POST /api/digests/<date>/reorder`：`{"item_ids":[3,1,2]}`，仅 draft。
- `DELETE /api/digest-items/<id>`：仅 draft。
- `POST /api/digests/<date>/finalize`：至少 1 条 `is_included=True`；设置 `status=reviewed`、`editor=request.user`；写 AuditLog。
- `GET /api/digests/<date>/export`：返回 `text/markdown`，内容：
  ```markdown
  # 微小 / 抖小游戏榜单情报日报
  - 日期：2026-10-16
  - 状态：已定稿

  ## 今日概览
  - ...
    > 来源：...
  ```
  草稿也可导出，标题状态为“草稿”。

- [ ] **Step 3: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.digest.tests.test_editor -v 2
git add backend/apps/digest backend/config/urls.py
git commit -m "feat: 日报编辑、定稿与 Markdown 导出"
```

---

### Task 20: 日报编辑器页面

**Files:**
- Create: `frontend/src/api/digest.ts`
- Modify: `frontend/src/views/DigestView.vue`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: 实现页面**

`DigestView.vue`：

- 顶部日期选择、状态标签、生成/重新生成、定稿、导出按钮。
- 未生成时显示空态与“生成初稿”。
- 六个 `el-card` 章节，条目行：
  - `el-checkbox` 控制 `is_included`。
  - 文本显示 `text_override || generated_text`。
  - 来源按钮打开 `el-drawer`，显示引用与原文链接。
  - `el-button` 上移/下移、编辑、删除（仅草稿）。
  - 编辑用 `el-input type=textarea`，保存写 `text_override`，显示“人工改写”标签。
- 定稿后禁用全部编辑，只保留导出。
- 导出调用 `GET /api/digests/<date>/export`，用 Blob 下载 `.md`。

- [ ] **Step 2: 构建、手动验证、提交并打标签**

```powershell
cd frontend
npm run build
cd ../backend
.\.venv\Scripts\python.exe manage.py test apps.digest -v 2
git add frontend/src
git commit -m "feat: 日报编辑器页面"
git tag phase-5
```

手动验证：生成初稿 → 取消勾选/改写/排序/删除 → 定稿 → 导出 Markdown；刷新后定稿状态保持；再次生成被拒绝。

---

## 十一、Phase 6：设置、工作台与端到端回归

### Task 21: 设置 API（公众号、品类、标签、成员、模型）

**Files:**
- Modify: `backend/apps/content/api.py`
- Modify: `backend/apps/intel/api/categories.py`
- Create: `backend/apps/intel/api/tags.py`
- Create: `backend/apps/accounts/api.py`（成员管理）
- Create: `backend/apps/core/settings_api.py`
- Create: `backend/apps/core/tests/test_settings.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: 实现设置 API**

仅 admin：

- `GET/POST/PATCH /api/sources`：新增/编辑名称、平台、权重、状态、备注。
- `GET/POST/PATCH /api/categories`：三级品类维护。
- `GET/POST/PATCH /api/tags`：按维度维护标签。
- `GET/POST/PATCH /api/members`：创建 Django User + `UserProfile.role`，不能删除自己。
- `GET/PATCH /api/settings/model`：读写 `SystemSetting(key="llm")`；GET 返回 `api_key` 掩码 `sk-****`；PATCH 若传入掩码值则保留旧 Key。
- `POST /api/settings/model/test`：用 `complete_json` 发一个极短请求，返回 `{ok, latency_ms}`；失败返回 502。

所有写操作调用 `log_action`。

- [ ] **Step 2: 写测试**

覆盖：operator 访问设置 403；admin 创建公众号/品类/标签/成员；模型配置掩码；测试连接 patch `complete_json` 成功/失败。

- [ ] **Step 3: 运行并提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.core.tests.test_settings -v 2
git add backend/apps backend/config/urls.py
git commit -m "feat: 设置与成员管理 API"
```

---

### Task 22: 设置页面、工作台聚合与角色权限

**Files:**
- Create: `backend/apps/intel/api/workbench.py`
- Create: `backend/apps/intel/tests/test_workbench.py`
- Modify: `backend/apps/intel/urls.py`
- Create: `frontend/src/api/workbench.ts`
- Modify: `frontend/src/views/WorkbenchView.vue`
- Modify: `frontend/src/views/SettingsView.vue`
- Modify: `frontend/src/layouts/AppLayout.vue`

- [ ] **Step 1: 实现工作台聚合 API**

`GET /api/workbench?date=YYYY-MM-DD` 返回：

```json
{
  "date": "2026-10-16",
  "pending": {"mapping": 3, "category": 2, "claims": 2, "errors": 1, "total": 8},
  "new_entries": 5,
  "source_coverage": 12,
  "movements": [{"game_id": 1, "game_name": "抓大鹅", "platform": "wechat_mini", "rank": 1, "trend": "up", "delta": 4, "note": "重回榜首"}],
  "digest": {"status": "draft", "selected": 13, "total": 15, "date": "2026-10-16"},
  "recent_articles": [{"id": 1, "title": "...", "source": "游戏葡萄", "status": "extracted", "time": "..."}]
}
```

movements 取当天官方/provisional Snapshot 的 `trend in (new, up, down)` 前 10 条。`recent_articles` 只取 `is_draft=False` 的文章。

- [ ] **Step 2: 实现工作台页面**

`WorkbenchView.vue`：

- 顶部按系统时间问候（“早上好，主人”等六段；日期同步系统时间）。
- 四个统计卡：待核、今日新进、覆盖信源、日报进度。
- 今日异动 `el-table`，点击跳游戏档案。
- 待核队列快捷卡，按角色隐藏写入口。
- 日报进度卡，跳 `/digest/<date>`。
- 最近投喂列表，点击跳文章详情。
- `lead` 隐藏投喂/待核入口与写按钮。

- [ ] **Step 3: 实现设置页面**

`SettingsView.vue` 五个 `el-tab-pane`：

- 公众号：表格 + 新增/编辑弹窗 + 启用/暂停。
- 品类树：`el-tree` 或递归列表 + 新增 L1/L2/L3 弹窗。
- 标签：按维度分组 + 新增。
- 成员与角色：表格 + 新增成员 + 修改角色。
- 模型/OCR：Base URL、模型、API Key（写空保留）、OCR 只读“RapidOCR”，测试连接、保存。

仅 admin 路由可进入；后端同时校验。

- [ ] **Step 4: 写工作台测试**

覆盖：待核计数、movements、digest 进度、最近文章；lead 请求写接口 403。

- [ ] **Step 5: 构建、测试与提交**

```powershell
.\.venv\Scripts\python.exe manage.py test apps.intel.tests.test_workbench -v 2
cd frontend
npm run build
git add backend/apps/intel frontend/src
git commit -m "feat: 工作台聚合与设置页面"
```

---

### Task 23: 演示数据、端到端回归与 Git 稳定版

**Files:**
- Create: `backend/apps/core/management/commands/seed_demo.py`
- Create: `backend/apps/ingest/tests/test_batch_ingest.py`
- Create: `README.md`
- Modify: `.gitignore`（如需）

- [ ] **Step 1: 写 seed_demo**

创建：

- 用户：`operator/operator123`、`lead/lead123`、`admin/admin123`。
- 12 个公众号信源（含启用/暂停）。
- 5 个 L1、对应 L2/L3。
- 10 款游戏（含别名、品类路径、质量标记）。
- 8 篇示例文章（含 1 篇失败、1 篇待核截图）。
- 微信/抖音官方或转述 Snapshot、Entry、Conflict、Claim。
- 1 份日报草稿。

命令必须幂等：`get_or_create` / `update_or_create`，重复执行不重复创建。

- [ ] **Step 2: 写 20 篇批量投喂测试**

`test_batch_ingest.py`：

- patch `fetch_article` 返回 20 个不同 URL 的 `FetchResult`。
- patch `extract_article` 返回固定 `ExtractionResult`。
- `TASKS_SYNC=True` 调 `POST /api/ingest/link` 提交 20 条。
- 断言 20 个 Article 创建、20 个后台任务完成、无静默丢失、重复 URL 只计一次。

- [ ] **Step 3: 端到端回归清单**

按顺序执行并记录结果：

1. `manage.py check` 无错误。
2. `manage.py test` 全绿。
3. `npm run build` 成功。
4. 启动 MariaDB、Django、Vite；登录三个角色。
5. 运营：链接/截图/全文各投喂一篇；预览确认；榜单/待核/游戏档案/日报全链路。
6. 负责人：只读查看榜单、游戏档案、日报；可导出；投喂/待核/设置被拒绝。
7. 管理员：设置新增公众号/品类/标签/成员；模型测试连接；权限生效。
8. 重启 Django 后重新查询文章、榜单、日报，确认 MariaDB 数据持久化。
9. 20 篇批量测试通过；重复投喂只计一次。
10. 日报定稿后编辑被拒绝，Markdown 可导出。
11. 差异“标记已核实/保留分歧”写入 `resolution_note/resolved_by`。
12. Git 工作区干净，标签存在。

- [ ] **Step 4: 写 README**

至少包含：

- 技术栈与目录结构。
- MariaDB 初始化、`.env` 配置。
- 后端：venv、pip install、migrate、seed_demo、runserver。
- 前端：npm install、npm run dev、npm run build。
- 测试命令。
- 三角色演示账号。
- 已知待确认项（解析预览编辑粒度、日报定稿后纠错路径）。

- [ ] **Step 5: 最终提交、标签与合并**

```powershell
git add backend frontend README.md
git commit -m "test: 完成端到端回归与演示数据"
git tag phase-6
git checkout main
git merge --no-ff feature/engineering-mvp
git tag v1.0.0-engineering-mvp
```

若用户不希望自动合并，保留 `feature/engineering-mvp` 分支和 `phase-6` 标签，等待确认后再合并。

---

## 十二、Debug 与验证约定

1. **先复现再修复**：任何失败先补一个最小测试或固定命令；不要在未复现时改业务代码。
2. **数据库问题**：先确认 `mysql --version`、MariaDB 服务、`ranking_intel` 与 `test_ranking_intel` 权限；Django 连接错误优先看 `.env` 和 `manage.py check --database default`。
3. **CSRF / Session 问题**：确认前端先请求 `/api/auth/csrf`，所有非 GET 请求带 `X-CSRFToken`，`credentials: 'include'`，Vite 代理未改写 Cookie。
4. **后台任务问题**：测试固定 `TASKS_SYNC=1`；生产线程池必须 `close_old_connections()`；任务异常必须写入 `failure_reason`，不能静默丢失。
5. **LLM/OCR 问题**：测试全部 mock；真实调用失败时文章置 `failed` 并保留错误，不阻塞其他文章；RapidOCR 导入失败时截图通道返回明确错误。
6. **数据持久化验证**：每次阶段验收至少重启一次 Django，再通过 API 或 SQL 查询确认数据仍在 MariaDB。
7. **回归边界**：只回归本阶段影响的模块；最终 Phase 6 做一次全链路回归，不引入 P1/P2 功能。

---

## 十三、完成定义（DoD）

- [ ] PRD §13 已同步为 Vue 3 + Django + MariaDB，PRD 版本记录已更新。
- [ ] `manage.py check`、`manage.py test`、`npm run build` 全部通过。
- [ ] 三个角色登录与权限符合页面结构规划 V1.1。
- [ ] 三通道投喂、预览确认/取消、去重、重试可用。
- [ ] 官方/转述榜单、暂定快照、差异结论、待核队列可用。
- [ ] 三级品类、游戏库、游戏档案、别名可用。
- [ ] 日报生成、编辑、定稿锁定、Markdown 导出可用。
- [ ] MariaDB 重启后数据仍在；20 篇批量投喂无丢失。
- [ ] Git 分支、阶段标签 `phase-0` 至 `phase-6`、最终标签存在。
- [ ] README 可让新成员从零启动项目。

---

## 十四、执行交接

计划已保存到 `docs/superpowers/plans/2026-10-17-mini-game-ranking-intel-platform-engineering.md`。

执行时二选一：

1. **Subagent-Driven（推荐）**：每个 Task 派发独立子 Agent，主 Agent 在任务间做代码审查与阶段验收。
2. **Inline Execution**：在当前会话按 Phase 顺序执行，每阶段结束停下来验收。

本阶段不开始执行，等待确认后再进入正式开发。

