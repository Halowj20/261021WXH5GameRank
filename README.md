# 微小 / 抖小游戏榜单情报平台

V1.0 MVP：每日微信公众号榜单情报的投喂、归并、待核、游戏档案与日报输出。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Element Plus + Vue Router
- 后端：Python 3.12 + Django 5.2（原生 JSON 视图 + Session 鉴权）
- 数据库：MariaDB（本机实例端口 3307）
- 任务：进程内线程池 + 状态回写 + 手动重试
- OCR：RapidOCR 本地适配器
- 模型：OpenAI 兼容接口，可在设置页配置

## 目录

```text
backend/    Django API、模型、采集/归并/日报服务
frontend/   Vue SPA
docs/       产品定义、PRD、页面结构与实施计划
prototype-v0.1/  已冻结的可交互原型
```

## 本机启动

### 1. 数据库

本机 MariaDB 实例端口为 `3307`，`.env` 已配置：

```dotenv
DB_NAME=ranking_intel
DB_USER=ranking
DB_PASSWORD=ranking_dev
DB_HOST=127.0.0.1
DB_PORT=3307
```

如数据库不存在，先用管理员账号创建：

```sql
CREATE DATABASE IF NOT EXISTS ranking_intel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ranking'@'localhost' IDENTIFIED BY 'ranking_dev';
GRANT ALL PRIVILEGES ON ranking_intel.* TO 'ranking'@'localhost';
GRANT ALL PRIVILEGES ON test_ranking_intel.* TO 'ranking'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 后端

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

如果尚未创建虚拟环境：

```powershell
& "C:\Users\Miya\AppData\Roaming\uv\python\cpython-3.12.14-windows-x86_64-none\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. 前端

```powershell
cd frontend
npm install
npm run dev
```

访问 `http://127.0.0.1:5173`。

## 演示账号

| 角色 | 用户名 | 密码 | 权限 |
|---|---|---|---|
| 运营 | operator | operator123 | 投喂、待核、榜单差异处理、游戏档案、日报编辑 |
| 负责人 | lead | lead123 | 只读 + 日报导出 |
| 管理员 | admin | admin123 | 全部权限 + 设置 |

## 验证

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py test

cd ../frontend
npm run build
```

当前后端测试覆盖登录/角色、内容层、品类与游戏、归并冲突、待核映射、三通道投喂、20 篇批量、日报生成/定稿/导出。

## OCR / 模型说明

- RapidOCR 已锁定兼容版本：`numpy==1.26.4`、`opencv-python==4.10.0.84`、`onnxruntime==1.19.2`。
- 未配置 `LLM_API_KEY` 时，抽取会使用明确标记的本地 Fixture 抽取器打通链路；配置后使用 OpenAI 兼容接口。
- 管理员的“设置 → 模型 / OCR”可保存配置并测试连接。

## 已知待确认项

1. 解析预览是否支持正文/榜单候选与入库前修正（当前仅确认/取消）。
2. 日报定稿后是否允许撤销、重开或版本化（当前定稿即锁定）。

这两项已记录在 PRD §17 与页面结构规划 §3.2，不影响 MVP 主链路。
