# 微小 / 抖小游戏榜单情报平台 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可在本机跑通的榜单情报平台 P0：三通道投喂、榜单归并与冲突提示、三级品类、游戏档案、待核队列、日报生成与导出。

**Architecture:** 前后端分离。后端 FastAPI + SQLAlchemy 2.0 + SQLite，按「原始 / 事实 / 主数据 / 观点 / 产物」五层建模，归并与日报生成实现为可单测的纯服务层；前端 React + TypeScript + Ant Design，六个页面直连 REST API。LLM 与 OCR 均通过适配器隔离，测试中用假实现，不依赖外部网络。

**Tech Stack:** Python 3.12、FastAPI、SQLAlchemy 2.0、Pydantic v2、pytest、httpx、trafilatura；React 18、TypeScript、Vite、Ant Design、React Router、dayjs。

---

## 环境前提

本机默认 `python` 是 3.15，依赖兼容性差。以下所有后端命令都使用 3.12 解释器，先把它设成变量：

```powershell
$PY = "C:\Users\Miya\AppData\Roaming\uv\python\cpython-3.12.14-windows-x86_64-none\python.exe"
```

## 文件结构

```
backend/
  requirements.txt
  pytest.ini
  .env.example
  app/
    __init__.py
    config.py                  # 环境配置
    db.py                      # engine / session / get_db
    main.py                    # FastAPI 应用装配
    deps.py                    # 鉴权依赖
    models/
      __init__.py              # 统一导出 Base 与全部模型
      base.py                  # Base、时间戳
      content.py               # Source / Article / Asset
      ranking.py               # Observation / Snapshot / Entry / Conflict
      catalog.py               # Game / Alias / Category / Tag / GameRelation
      digest.py                # Claim / Digest / DigestItem / AuditLog
    schemas/
      __init__.py
      common.py                # 通用响应
      ingest.py                # 投喂请求/响应
      ranking.py               # 榜单输出
      catalog.py               # 品类/游戏输出
      digest.py                # 日报输出
    services/
      __init__.py
      dedupe.py                # 正文指纹与重复判断
      fetch.py                 # 链接抓取
      ocr.py                   # OCR 适配器
      llm.py                   # OpenAI 兼容客户端
      extract.py               # 文章 -> 榜单/观点
      merge.py                 # 观测 -> 快照/条目/冲突（核心）
      catalog.py               # 游戏归一、别名学习、档案聚合
      review.py                # 待核队列查询
      digest.py                # 日报生成与导出
    api/
      __init__.py
      auth.py                  # 登录
      ingest.py                # 投喂三通道
      review.py                # 待核处理
      rankings.py              # 榜单中心
      games.py                 # 游戏库/档案
      categories.py            # 品类树
      digest.py                # 日报
      workbench.py             # 工作台聚合
  tests/
    conftest.py
    test_health.py
    test_categories.py
    test_dedupe.py
    test_ingest.py
    test_extract.py
    test_merge.py
    test_catalog.py
    test_review.py
    test_digest.py
    test_api_flow.py
  scripts/
    seed_demo.py               # 生成演示数据，用于验收
  data/                        # sqlite 与上传文件（gitignore）

frontend/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  src/
    main.tsx
    App.tsx                    # 路由与布局
    api.ts                     # fetch 封装 + token
    types.ts                   # 与后端对应的类型
    pages/
      Login.tsx
      Workbench.tsx
      Ingest.tsx
      Rankings.tsx
      Games.tsx
      DigestEditor.tsx
      Settings.tsx
    components/
      SourceTag.tsx            # 来源类型/状态标签
```

`.gitignore` 追加：

```
.venv/
__pycache__/
*.pyc
backend/data/
frontend/node_modules/
frontend/dist/
```

---

### Task 1: 后端脚手架与健康检查

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/pytest.ini`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/db.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/test_health.py`
- Modify: `.gitignore`

- [ ] **Step 1: 写依赖与配置文件**

`backend/requirements.txt`

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
pydantic-settings==2.7.0
httpx==0.28.1
python-multipart==0.0.20
trafilatura==2.0.0
pytest==8.3.4
```

`backend/pytest.ini`

```
[pytest]
testpaths = tests
pythonpath = .
```

`backend/.env.example`

```
DATABASE_URL=sqlite:///./data/app.db
UPLOAD_DIR=./data/uploads
APP_PASSWORD=admin123
APP_TOKEN=dev-token
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
```

- [ ] **Step 2: 写配置与数据库连接**

`backend/app/config.py`

```python
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/app.db"
    upload_dir: Path = Path("./data/uploads")
    app_password: str = "admin123"
    app_token: str = "dev-token"
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"


settings = Settings()
```

`backend/app/db.py`

```python
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: 写应用入口和失败测试**

`backend/app/main.py`

```python
from fastapi import FastAPI

from app.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="Mini Game Intel")

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "database": settings.database_url}

    return app


app = create_app()
```

`backend/tests/test_health.py`

```python
from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_ok():
    client = TestClient(create_app())
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

- [ ] **Step 4: 安装依赖并运行测试**

```powershell
cd backend
& $PY -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest tests/test_health.py -v
```

预期：`1 passed`。

- [ ] **Step 5: 提交**

```powershell
git add .gitignore backend
git commit -m "chore: 搭建 FastAPI 后端脚手架与健康检查"
```

---

### Task 2: 五层数据模型

**Files:**
- Create: `backend/app/models/base.py`
- Create: `backend/app/models/content.py`
- Create: `backend/app/models/ranking.py`
- Create: `backend/app/models/catalog.py`
- Create: `backend/app/models/digest.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_models.py`（本任务新建）

- [ ] **Step 1: 写 Base 与测试夹具**

`backend/app/models/base.py`

```python
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
```

`backend/tests/conftest.py`

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_db
from app.main import create_app
from app.models import Base


@pytest.fixture()
def db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db: Session) -> TestClient:
    app = create_app()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)
```

- [ ] **Step 2: 写原始层模型**

`backend/app/models/content.py`

```python
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Source(Base, TimestampMixin):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    platforms: Mapped[str] = mapped_column(String(60), default="wechat_mini")
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[str] = mapped_column(String(20), default="active")


class Article(Base, TimestampMixin):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"))
    title: Mapped[str] = mapped_column(String(300), default="")
    url: Mapped[str | None] = mapped_column(String(1000), index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime)
    raw_text: Mapped[str] = mapped_column(Text, default="")
    ingest_method: Mapped[str] = mapped_column(String(20), default="fulltext")
    content_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    parse_status: Mapped[str] = mapped_column(String(20), default="pending")
    failure_reason: Mapped[str | None] = mapped_column(String(500))


class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), index=True)
    type: Mapped[str] = mapped_column(String(20), default="screenshot")
    file_path: Mapped[str] = mapped_column(String(500))
    ocr_text: Mapped[str] = mapped_column(Text, default="")
    ocr_confidence: Mapped[float] = mapped_column(Float, default=0.0)
```

- [ ] **Step 3: 写事实层模型**

`backend/app/models/ranking.py`

```python
from datetime import date

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Observation(Base, TimestampMixin):
    """一篇公众号文章里出现的一条排名。"""

    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), index=True)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.id"))
    snapshot_id: Mapped[int | None] = mapped_column(ForeignKey("snapshots.id"))
    platform: Mapped[str] = mapped_column(String(20), index=True)
    board_type: Mapped[str] = mapped_column(String(40), index=True)
    observed_date: Mapped[date] = mapped_column(Date, index=True)
    rank: Mapped[int] = mapped_column(Integer)
    raw_game_name: Mapped[str] = mapped_column(String(200))
    game_id: Mapped[int | None] = mapped_column(ForeignKey("games.id"), index=True)
    trend_raw: Mapped[str | None] = mapped_column(String(20))
    source_type: Mapped[str] = mapped_column(String(30), default="article_citation")
    confidence: Mapped[float] = mapped_column(Float, default=1.0)


class Snapshot(Base, TimestampMixin):
    """同一平台 + 榜种 + 日期的归并榜单。"""

    __tablename__ = "snapshots"
    __table_args__ = (
        UniqueConstraint(
            "platform", "board_type", "observed_date", "source_type",
            name="uq_snapshot_key",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    platform: Mapped[str] = mapped_column(String(20), index=True)
    board_type: Mapped[str] = mapped_column(String(40), index=True)
    observed_date: Mapped[date] = mapped_column(Date, index=True)
    source_type: Mapped[str] = mapped_column(String(30))
    authority_score: Mapped[float] = mapped_column(Float, default=0.6)
    entry_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="provisional")


class Entry(Base, TimestampMixin):
    __tablename__ = "entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"), index=True)
    rank: Mapped[int] = mapped_column(Integer)
    game_id: Mapped[int | None] = mapped_column(ForeignKey("games.id"), index=True)
    raw_name: Mapped[str] = mapped_column(String(200))
    trend: Mapped[str] = mapped_column(String(10), default="flat")
    delta: Mapped[int] = mapped_column(Integer, default=0)
    evidence_ids: Mapped[str] = mapped_column(Text, default="[]")


class Conflict(Base, TimestampMixin):
    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject_type: Mapped[str] = mapped_column(String(20), default="ranking")
    subject_id: Mapped[int | None] = mapped_column(Integer)
    subject_key: Mapped[str] = mapped_column(String(300), index=True)
    window_start: Mapped[date | None] = mapped_column(Date)
    window_end: Mapped[date | None] = mapped_column(Date)
    claim_ids: Mapped[str] = mapped_column(Text, default="[]")
    conflict_type: Mapped[str] = mapped_column(String(20), default="ranking")
    status: Mapped[str] = mapped_column(String(20), default="open")
    detail: Mapped[str] = mapped_column(Text, default="{}")
```

- [ ] **Step 4: 写主数据层与观点/产物层模型**

`backend/app/models/catalog.py`

```python
from datetime import date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

game_tags = Table(
    "game_tags",
    Base.metadata,
    Column("game_id", ForeignKey("games.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("parent_id", "name", name="uq_category_parent_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    level: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(80))
    sort: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")


class Game(Base, TimestampMixin):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    canonical_name: Mapped[str] = mapped_column(String(200), unique=True)
    publisher: Mapped[str | None] = mapped_column(String(120))
    developer: Mapped[str | None] = mapped_column(String(120))
    platforms: Mapped[str] = mapped_column(String(60), default="")
    release_date: Mapped[date | None] = mapped_column(Date)
    online_status: Mapped[str] = mapped_column(String(20), default="online")
    has_isbn: Mapped[bool] = mapped_column(Boolean, default=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    category_source: Mapped[str] = mapped_column(String(10), default="ai")
    quality_flags: Mapped[str] = mapped_column(Text, default="[]")


class Alias(Base, TimestampMixin):
    __tablename__ = "aliases"
    __table_args__ = (UniqueConstraint("game_id", "alias", name="uq_game_alias"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    alias: Mapped[str] = mapped_column(String(200), index=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"))
    alias_type: Mapped[str] = mapped_column(String(20), default="article")
    confirmed_by: Mapped[str | None] = mapped_column(String(60))


class Tag(Base, TimestampMixin):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("name", "dimension", name="uq_tag_name_dim"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    dimension: Mapped[str] = mapped_column(String(20), default="gameplay")
    status: Mapped[str] = mapped_column(String(20), default="active")


class CategoryMapping(Base, TimestampMixin):
    __tablename__ = "category_mappings"
    __table_args__ = (
        UniqueConstraint("source_id", "raw_text", name="uq_category_mapping"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"))
    raw_text: Mapped[str] = mapped_column(String(200))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    confirmed_by: Mapped[str | None] = mapped_column(String(60))


class GameRelation(Base, TimestampMixin):
    __tablename__ = "game_relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_a_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    game_b_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    relation_type: Mapped[str] = mapped_column(String(30))
    score: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[str] = mapped_column(String(10), default="auto")
    confirmed_by: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20), default="suggested")
```

`backend/app/models/digest.py`

```python
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Claim(Base, TimestampMixin):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), index=True)
    subject_type: Mapped[str] = mapped_column(String(20))
    subject_id: Mapped[int | None] = mapped_column(Integer, index=True)
    subject_name: Mapped[str] = mapped_column(String(200), index=True)
    claim_text: Mapped[str] = mapped_column(Text)
    stance: Mapped[str] = mapped_column(String(20), default="neutral")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    quote: Mapped[str] = mapped_column(Text, default="")
    quote_start: Mapped[int | None] = mapped_column(Integer)
    quote_end: Mapped[int | None] = mapped_column(Integer)
    extracted_by: Mapped[str] = mapped_column(String(10), default="ai")
    verify_status: Mapped[str] = mapped_column(String(20), default="pending")
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime)


class Digest(Base, TimestampMixin):
    __tablename__ = "digests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    digest_date: Mapped[date] = mapped_column(Date, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    generated_at: Mapped[datetime | None] = mapped_column(DateTime)
    editor_id: Mapped[str | None] = mapped_column(String(60))
    version: Mapped[int] = mapped_column(Integer, default=1)


class DigestItem(Base, TimestampMixin):
    __tablename__ = "digest_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    digest_id: Mapped[int] = mapped_column(ForeignKey("digests.id"), index=True)
    section: Mapped[str] = mapped_column(String(40))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    ref_type: Mapped[str] = mapped_column(String(20), default="snapshot")
    ref_id: Mapped[int | None] = mapped_column(Integer)
    auto_text: Mapped[str] = mapped_column(Text, default="")
    text_override: Mapped[str | None] = mapped_column(Text)
    editor_note: Mapped[str | None] = mapped_column(Text)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor: Mapped[str] = mapped_column(String(60), default="system")
    action: Mapped[str] = mapped_column(String(60))
    entity_type: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[int | None] = mapped_column(Integer)
    before: Mapped[str] = mapped_column(Text, default="{}")
    after: Mapped[str] = mapped_column(Text, default="{}")
```

`backend/app/models/__init__.py`

```python
from app.models.base import Base, TimestampMixin
from app.models.catalog import (
    Alias,
    Category,
    CategoryMapping,
    Game,
    GameRelation,
    Tag,
    game_tags,
)
from app.models.content import Article, Asset, Source
from app.models.digest import AuditLog, Claim, Digest, DigestItem
from app.models.ranking import Conflict, Entry, Observation, Snapshot

__all__ = [
    "Alias",
    "Article",
    "Asset",
    "AuditLog",
    "Base",
    "Category",
    "CategoryMapping",
    "Claim",
    "Conflict",
    "Digest",
    "DigestItem",
    "Entry",
    "Game",
    "GameRelation",
    "Observation",
    "Snapshot",
    "Source",
    "Tag",
    "TimestampMixin",
    "game_tags",
]
```

- [ ] **Step 5: 写失败测试并运行**

`backend/tests/test_models.py`

```python
from datetime import date

from sqlalchemy import select

from app.models import Article, Observation, Snapshot, Source


def test_models_persist_and_unique_snapshot(db):
    source = Source(name="示例公众号")
    db.add(source)
    db.commit()

    article = Article(source_id=source.id, title="榜单", raw_text="正文")
    db.add(article)
    db.commit()

    observation = Observation(
        article_id=article.id,
        platform="douyin_mini",
        board_type="hot",
        observed_date=date(2026, 10, 16),
        rank=1,
        raw_game_name="示例游戏",
    )
    db.add(observation)
    db.commit()

    snapshot = Snapshot(
        platform="douyin_mini",
        board_type="hot",
        observed_date=date(2026, 10, 16),
        source_type="article_citation",
    )
    db.add(snapshot)
    db.commit()

    assert db.scalar(select(Article).where(Article.title == "榜单")).id == article.id
    assert db.scalar(select(Observation)).rank == 1
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_models.py -v
```

预期：`1 passed`。

- [ ] **Step 6: 提交**

```powershell
git add backend
git commit -m "feat: 建立五层数据模型"
```

---

### Task 3: 简单登录与鉴权

**Files:**
- Create: `backend/app/deps.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/auth.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_auth.py`

```python
def test_login_with_wrong_password_returns_401(client):
    response = client.post("/api/auth/login", json={"password": "wrong"})
    assert response.status_code == 401


def test_login_returns_token_and_protected_route_requires_it(client):
    login = client.post("/api/auth/login", json={"password": "admin123"})
    assert login.status_code == 200
    token = login.json()["token"]

    denied = client.get("/api/auth/me")
    assert denied.status_code == 401

    allowed = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert allowed.status_code == 200
    assert allowed.json()["role"] == "operator"
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_auth.py -v
```

预期：`404 Not Found`，测试失败。

- [ ] **Step 3: 实现鉴权**

`backend/app/deps.py`

```python
from fastapi import Header, HTTPException

from app.config import settings


def require_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    expected = f"Bearer {settings.app_token}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="未登录或令牌无效")
    return {"username": "operator", "role": "operator"}
```

`backend/app/api/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.deps import require_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, str]:
    if payload.password != settings.app_password:
        raise HTTPException(status_code=401, detail="密码错误")
    return {"token": settings.app_token}


@router.get("/me")
def me(user: dict = Depends(require_user)) -> dict[str, str]:
    return user
```

`backend/app/main.py` 改为：

```python
from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="Mini Game Intel")
    app.include_router(auth_router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "database": settings.database_url}

    return app


app = create_app()
```

- [ ] **Step 4: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_auth.py -v
```

预期：`2 passed`。

- [ ] **Step 5: 提交**

```powershell
git add backend
git commit -m "feat: 增加简单登录与 Bearer 鉴权"
```

---

### Task 4: 三级品类树

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/catalog.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/catalog.py`（本任务只写品类部分）
- Create: `backend/app/api/categories.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_categories.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_categories.py`

```python
def test_create_three_level_tree_and_reject_bad_level(client, db):
    l1 = client.post("/api/categories", json={"name": "休闲益智", "parent_id": None})
    assert l1.status_code == 201
    l1_id = l1.json()["id"]
    assert l1.json()["level"] == 1

    l2 = client.post("/api/categories", json={"name": "消除", "parent_id": l1_id})
    assert l2.status_code == 201
    l2_id = l2.json()["id"]
    assert l2.json()["level"] == 2

    l3 = client.post("/api/categories", json={"name": "三消", "parent_id": l2_id})
    assert l3.status_code == 201
    assert l3.json()["level"] == 3

    too_deep = client.post("/api/categories", json={"name": "四消", "parent_id": l3.json()["id"]})
    assert too_deep.status_code == 400
    assert too_deep.json()["detail"] == "品类最多三级"


def test_tree_endpoint_returns_nested_structure(client):
    root = client.post("/api/categories", json={"name": "策略", "parent_id": None}).json()
    child = client.post("/api/categories", json={"name": "塔防", "parent_id": root["id"]}).json()
    client.post("/api/categories", json={"name": "放置塔防", "parent_id": child["id"]})

    tree = client.get("/api/categories/tree")
    assert tree.status_code == 200
    root_node = tree.json()[0]
    assert root_node["name"] == "策略"
    assert root_node["children"][0]["name"] == "塔防"
    assert root_node["children"][0]["children"][0]["name"] == "放置塔防"
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_categories.py -v
```

预期：`404`，测试失败。

- [ ] **Step 3: 实现品类服务与接口**

`backend/app/schemas/catalog.py`

```python
from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    parent_id: int | None = None
    sort: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    sort: int | None = None
    status: str | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None
    level: int
    name: str
    sort: int
    status: str


class CategoryNode(CategoryOut):
    children: list["CategoryNode"] = []
```

`backend/app/services/catalog.py`

```python
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category


def create_category(db: Session, name: str, parent_id: int | None, sort: int = 0) -> Category:
    level = 1
    if parent_id is not None:
        parent = db.get(Category, parent_id)
        if parent is None:
            raise HTTPException(status_code=404, detail="父品类不存在")
        level = parent.level + 1
        if level > 3:
            raise HTTPException(status_code=400, detail="品类最多三级")

    category = Category(name=name, parent_id=parent_id, level=level, sort=sort)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def build_tree(db: Session) -> list[dict]:
    categories = list(db.scalars(select(Category).order_by(Category.sort, Category.id)))
    nodes: dict[int, dict] = {}
    for category in categories:
        nodes[category.id] = {
            "id": category.id,
            "parent_id": category.parent_id,
            "level": category.level,
            "name": category.name,
            "sort": category.sort,
            "status": category.status,
            "children": [],
        }
    roots: list[dict] = []
    for category in categories:
        node = nodes[category.id]
        if category.parent_id and category.parent_id in nodes:
            nodes[category.parent_id]["children"].append(node)
        else:
            roots.append(node)
    return roots
```

`backend/app/api/categories.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_user
from app.schemas.catalog import CategoryCreate, CategoryNode, CategoryOut
from app.services.catalog import build_tree, create_category

router = APIRouter(prefix="/api/categories", tags=["categories"], dependencies=[Depends(require_user)])


@router.post("", response_model=CategoryOut, status_code=201)
def create(payload: CategoryCreate, db: Session = Depends(get_db)) -> CategoryOut:
    return create_category(db, payload.name, payload.parent_id, payload.sort)


@router.get("/tree", response_model=list[CategoryNode])
def tree(db: Session = Depends(get_db)) -> list[dict]:
    return build_tree(db)
```

`backend/app/main.py` 增加：

```python
from app.api.categories import router as categories_router
...
    app.include_router(categories_router)
```

- [ ] **Step 4: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_categories.py -v
```

预期：`2 passed`。

- [ ] **Step 5: 提交**

```powershell
git add backend
git commit -m "feat: 三级品类树与接口"
```

---

### Task 5: 去重、链接抓取与文字投喂

**Files:**
- Create: `backend/app/services/dedupe.py`
- Create: `backend/app/services/fetch.py`
- Create: `backend/app/schemas/ingest.py`
- Create: `backend/app/api/ingest.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_dedupe.py`
- Test: `backend/tests/test_ingest.py`

- [ ] **Step 1: 写去重与抓取的失败测试**

`backend/tests/test_dedupe.py`

```python
from app.services.dedupe import content_hash


def test_content_hash_ignores_whitespace_and_punctuation_spacing():
    assert content_hash("榜单 第一 名\n游戏A") == content_hash("榜单第一名游戏A")
    assert content_hash("abc") != content_hash("abd")
```

`backend/tests/test_ingest.py`

```python
from datetime import date

from sqlalchemy import func, select

from app.models import Article

HEADERS = {"Authorization": "Bearer dev-token"}


def test_link_ingest_fetches_and_dedupes_by_url(client, db, monkeypatch):
    calls = {"count": 0}

    def fake_fetch(url: str):
        calls["count"] += 1
        return ("今日榜单", "榜单正文内容", date(2026, 10, 16))

    monkeypatch.setattr("app.api.ingest.fetch_article", fake_fetch)

    first = client.post("/api/ingest/link", json={"urls": ["https://mp.weixin.qq.com/s/demo"]}, headers=HEADERS)
    assert first.status_code == 200
    assert first.json()[0]["duplicated"] is False

    second = client.post("/api/ingest/link", json={"urls": ["https://mp.weixin.qq.com/s/demo"]}, headers=HEADERS)
    assert second.status_code == 200
    assert second.json()[0]["duplicated"] is True
    assert calls["count"] == 1
    assert db.scalar(select(func.count(Article.id))) == 1


def test_fulltext_ingest_dedupes_by_content_hash(client, db):
    payload = {"title": "转载文章", "url": "https://example.com/a", "text": "同样的正文内容"}
    first = client.post("/api/ingest/fulltext", json=payload, headers=HEADERS)
    assert first.status_code == 200
    assert first.json()["duplicated"] is False

    other_url_same_text = {"title": "另一个号转载", "url": "https://example.com/b", "text": "同样的正文内容"}
    second = client.post("/api/ingest/fulltext", json=other_url_same_text, headers=HEADERS)
    assert second.status_code == 200
    assert second.json()["duplicated"] is True
    assert db.scalar(select(func.count(Article.id))) == 1


def test_link_fetch_failure_keeps_article_for_manual_fulltext(client, db, monkeypatch):
    def failing_fetch(url: str):
        raise RuntimeError("抓取超时")

    monkeypatch.setattr("app.api.ingest.fetch_article", failing_fetch)

    response = client.post("/api/ingest/link", json={"urls": ["https://mp.weixin.qq.com/s/bad"]}, headers=HEADERS)
    assert response.status_code == 200
    body = response.json()[0]
    assert body["parse_status"] == "failed"
    article = db.scalar(select(Article))
    assert article.failure_reason == "抓取超时"
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_dedupe.py tests/test_ingest.py -v
```

预期：导入错误，测试失败。

- [ ] **Step 3: 实现去重与抓取**

`backend/app/services/dedupe.py`

```python
import hashlib
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Article


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", "", text)


def content_hash(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def find_duplicate(
    db: Session, url: str | None, text: str
) -> Article | None:
    if url:
        existing = db.scalar(select(Article).where(Article.url == url))
        if existing is not None:
            return existing
    if text.strip():
        existing = db.scalar(
            select(Article).where(Article.content_hash == content_hash(text))
        )
        if existing is not None:
            return existing
    return None
```

`backend/app/services/fetch.py`

```python
from datetime import date, datetime

import httpx
import trafilatura


class FetchError(Exception):
    pass


def fetch_article(url: str) -> tuple[str, str, date | None]:
    """返回 (标题, 正文, 发布日期)。抓取失败抛 FetchError。"""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
    }
    try:
        response = httpx.get(url, headers=headers, timeout=25, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise FetchError(f"网络请求失败：{exc}") from exc

    if response.status_code >= 400:
        raise FetchError(f"HTTP {response.status_code}")

    html = response.text
    text = trafilatura.extract(html, include_comments=False, include_tables=True) or ""
    if not text.strip():
        raise FetchError("未提取到正文")

    metadata = trafilatura.extract_metadata(html)
    title = metadata.title if metadata and metadata.title else ""
    published_at = None
    if metadata and metadata.date:
        try:
            published_at = datetime.fromisoformat(metadata.date).date()
        except ValueError:
            published_at = None

    return title, text, published_at
```

- [ ] **Step 4: 实现投喂接口**

`backend/app/schemas/ingest.py`

```python
from pydantic import BaseModel, ConfigDict


class LinkIngestRequest(BaseModel):
    urls: list[str]
    source_id: int | None = None


class FulltextIngestRequest(BaseModel):
    title: str = ""
    url: str | None = None
    text: str
    source_id: int | None = None


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str | None
    parse_status: str
    duplicated: bool = False
```

`backend/app/api/ingest.py`

```python
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_user
from app.models import Article
from app.schemas.ingest import ArticleOut, FulltextIngestRequest, LinkIngestRequest
from app.services.dedupe import content_hash, find_duplicate
from app.services.fetch import FetchError, fetch_article

router = APIRouter(
    prefix="/api/ingest",
    tags=["ingest"],
    dependencies=[Depends(require_user)],
)


def _to_out(article: Article, duplicated: bool) -> ArticleOut:
    return ArticleOut(
        id=article.id,
        title=article.title,
        url=article.url,
        parse_status=article.parse_status,
        duplicated=duplicated,
    )


@router.post("/link", response_model=list[ArticleOut])
def ingest_links(payload: LinkIngestRequest, db: Session = Depends(get_db)) -> list[ArticleOut]:
    results: list[ArticleOut] = []
    for url in payload.urls:
        duplicate = find_duplicate(db, url, "")
        if duplicate is not None:
            results.append(_to_out(duplicate, True))
            continue
        try:
            title, text, published_at = fetch_article(url)
        except (FetchError, RuntimeError) as exc:
            article = Article(
                source_id=payload.source_id,
                url=url,
                title="",
                raw_text="",
                ingest_method="link",
                parse_status="failed",
                failure_reason=str(exc),
            )
            db.add(article)
            db.commit()
            db.refresh(article)
            results.append(_to_out(article, False))
            continue

        article = Article(
            source_id=payload.source_id,
            title=title,
            url=url,
            published_at=datetime.combine(published_at, datetime.min.time()) if published_at else None,
            fetched_at=datetime.now(),
            raw_text=text,
            ingest_method="link",
            content_hash=content_hash(text),
            parse_status="pending",
        )
        db.add(article)
        db.commit()
        db.refresh(article)
        results.append(_to_out(article, False))
    return results


@router.post("/fulltext", response_model=ArticleOut)
def ingest_fulltext(payload: FulltextIngestRequest, db: Session = Depends(get_db)) -> ArticleOut:
    duplicate = find_duplicate(db, payload.url, payload.text)
    if duplicate is not None:
        return _to_out(duplicate, True)

    article = Article(
        source_id=payload.source_id,
        title=payload.title,
        url=payload.url,
        raw_text=payload.text,
        ingest_method="fulltext",
        content_hash=content_hash(payload.text),
        parse_status="pending",
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return _to_out(article, False)
```

`backend/app/main.py` 增加：

```python
from app.api.ingest import router as ingest_router
...
    app.include_router(ingest_router)
```

- [ ] **Step 5: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_dedupe.py tests/test_ingest.py -v
```

预期：`4 passed`。

- [ ] **Step 6: 提交**

```powershell
git add backend
git commit -m "feat: 链接与全文投喂、正文指纹去重"
```

---

### Task 6: 截图投喂与 OCR 适配器

**Files:**
- Create: `backend/app/services/ocr.py`
- Modify: `backend/app/api/ingest.py`
- Modify: `backend/app/config.py`（确保上传目录可创建）
- Test: `backend/tests/test_ocr_ingest.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_ocr_ingest.py`

```python
from sqlalchemy import select

from app.models import Article, Asset
from app.services.ocr import OcrResult

HEADERS = {"Authorization": "Bearer dev-token"}


def test_screenshot_upload_runs_ocr_and_marks_review(client, db, monkeypatch, tmp_path):
    monkeypatch.setattr(
        "app.api.ingest.ocr_image",
        lambda path: OcrResult(text="1 示例游戏\n2 另一款", confidence=0.52),
    )

    response = client.post(
        "/api/ingest/screenshot",
        files={"file": ("rank.png", b"fake-image-bytes", "image/png")},
        data={"title": "抖音榜截图"},
        headers=HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["parse_status"] == "needs_review"

    asset = db.scalar(select(Asset))
    assert asset.ocr_confidence == 0.52
    assert "示例游戏" in asset.ocr_text

    article = db.scalar(select(Article))
    assert article.ingest_method == "screenshot"
    assert "示例游戏" in article.raw_text
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_ocr_ingest.py -v
```

预期：`404`，测试失败。

- [ ] **Step 3: 实现 OCR 适配器**

`backend/app/services/ocr.py`

```python
from dataclasses import dataclass
from pathlib import Path


@dataclass
class OcrResult:
    text: str
    confidence: float


_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        from rapidocr_onnxruntime import RapidOCR

        _engine = RapidOCR()
    return _engine


def ocr_image(path: Path) -> OcrResult:
    """识别截图文字。未安装 OCR 依赖时返回空结果，交由人工处理。"""
    try:
        engine = _get_engine()
    except ImportError:
        return OcrResult(text="", confidence=0.0)

    result, _ = engine(str(path))
    if not result:
        return OcrResult(text="", confidence=0.0)

    lines = [str(item[1]) for item in result]
    scores = [float(item[2]) for item in result]
    return OcrResult(text="\n".join(lines), confidence=sum(scores) / len(scores))
```

`backend/requirements.txt` 追加：

```
rapidocr-onnxruntime==1.4.4
```

- [ ] **Step 4: 实现截图接口**

`backend/app/api/ingest.py` 增加导入：

```python
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
```

并追加：

```python
@router.post("/screenshot", response_model=ArticleOut)
def ingest_screenshot(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    source_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
) -> ArticleOut:
    from app.config import settings
    from app.models import Asset
    from app.services.ocr import ocr_image

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "upload.png").suffix or ".png"
    file_path = settings.upload_dir / f"{uuid.uuid4().hex}{suffix}"
    file_path.write_bytes(file.file.read())

    ocr_result = ocr_image(file_path)

    article = Article(
        source_id=source_id,
        title=title,
        raw_text=ocr_result.text,
        ingest_method="screenshot",
        parse_status="needs_review" if ocr_result.confidence < 0.7 else "pending",
    )
    db.add(article)
    db.flush()

    asset = Asset(
        article_id=article.id,
        type="screenshot",
        file_path=str(file_path),
        ocr_text=ocr_result.text,
        ocr_confidence=ocr_result.confidence,
    )
    db.add(asset)
    db.commit()
    db.refresh(article)
    return _to_out(article, False)
```

- [ ] **Step 5: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_ocr_ingest.py -v
```

预期：`1 passed`。

- [ ] **Step 6: 提交**

```powershell
git add backend
git commit -m "feat: 截图投喂与 OCR 适配器"
```

---

### Task 7: LLM 抽取榜单与观点

**Files:**
- Create: `backend/app/services/llm.py`
- Create: `backend/app/services/extract.py`
- Create: `backend/app/schemas/digest.py`
- Modify: `backend/app/api/ingest.py`
- Test: `backend/tests/test_extract.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_extract.py`

```python
from sqlalchemy import select

from app.models import Article, Claim, Observation

HEADERS = {"Authorization": "Bearer dev-token"}

ARTICLE_TEXT = "本周抖音小游戏热度榜：1. 羊了个羊 2. 合成大西瓜。羊了个羊玩法上头，但买量成本偏高。"


def _article(db) -> Article:
    article = Article(title="本周榜单", raw_text=ARTICLE_TEXT, ingest_method="fulltext")
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def test_extract_persists_observations_and_claims(client, db, monkeypatch):
    article = _article(db)
    payload = {
        "rankings": [
            {
                "platform": "douyin_mini",
                "board_type": "hot",
                "observed_date": "2026-10-16",
                "source_type": "article_citation",
                "items": [
                    {"rank": 1, "name": "羊了个羊", "trend": "up", "delta": 2},
                    {"rank": 2, "name": "合成大西瓜"},
                ],
            }
        ],
        "claims": [
            {
                "subject_type": "game",
                "subject_name": "羊了个羊",
                "stance": "positive",
                "claim_text": "玩法上头",
                "quote": "羊了个羊玩法上头",
                "confidence": 0.9,
            }
        ],
    }
    monkeypatch.setattr("app.services.extract.complete_json", lambda system, user: payload)

    response = client.post(f"/api/articles/{article.id}/extract", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["observation_count"] == 2
    assert body["claim_count"] == 1
    assert body["parse_status"] == "parsed"

    assert db.scalar(select(Observation).where(Observation.rank == 1)).raw_game_name == "羊了个羊"
    assert db.scalar(select(Claim)).quote == "羊了个羊玩法上头"


def test_extract_quote_not_in_article_goes_to_review(client, db, monkeypatch):
    article = _article(db)
    payload = {
        "rankings": [],
        "claims": [
            {
                "subject_type": "game",
                "subject_name": "羊了个羊",
                "stance": "negative",
                "claim_text": "买量成本极高",
                "quote": "这句话原文里没有",
                "confidence": 0.8,
            }
        ],
    }
    monkeypatch.setattr("app.services.extract.complete_json", lambda system, user: payload)

    response = client.post(f"/api/articles/{article.id}/extract", headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["parse_status"] == "needs_review"
    claim = db.scalar(select(Claim))
    assert claim.verify_status == "pending"


def test_extract_empty_result_marks_needs_review(client, db, monkeypatch):
    article = _article(db)
    monkeypatch.setattr(
        "app.services.extract.complete_json",
        lambda system, user: {"rankings": [], "claims": []},
    )

    response = client.post(f"/api/articles/{article.id}/extract", headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["parse_status"] == "needs_review"
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_extract.py -v
```

预期：`404`，测试失败。

- [ ] **Step 3: 实现 LLM 客户端**

`backend/app/services/llm.py`

```python
import json

import httpx

from app.config import settings


class LlmError(Exception):
    pass


def complete_json(system: str, user: str) -> dict:
    if not settings.llm_api_key:
        raise LlmError("未配置 LLM_API_KEY")

    response = httpx.post(
        f"{settings.llm_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.llm_model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=120,
    )
    if response.status_code >= 400:
        raise LlmError(f"模型调用失败：HTTP {response.status_code}")
    content = response.json()["choices"][0]["message"]["content"]
    return json.loads(content)
```

- [ ] **Step 4: 实现抽取服务**

`backend/app/services/extract.py`

```python
import json
import re
from datetime import date

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Article, Claim, Observation
from app.services.llm import complete_json

SYSTEM_PROMPT = """你是小游戏行业情报分析助手。从公众号文章中抽取两类信息，只输出 JSON。

1. rankings：文章中出现的榜单。字段：
   platform: wechat_mini 或 douyin_mini
   board_type: 榜单类型，如 hot / new / revenue / ads
   observed_date: YYYY-MM-DD，无法确定时用文章发布日期
   source_type: official_original（官方原始榜单）/ article_citation（公众号转述）/ manual
   items: [{rank, name, trend, delta}]

2. claims：作者对游戏、品类或大盘的判断。字段：
   subject_type: game / category / market
   subject_name: 对象名称
   stance: positive / negative / neutral
   claim_text: 一句话结论
   quote: 必须是从原文逐字复制的片段，不允许改写
   confidence: 0 到 1

规则：没有引用片段的观点不要输出；排名与名称照抄原文，不要翻译或补全。"""


class ExtractedRankItem(BaseModel):
    rank: int
    name: str
    trend: str | None = None
    delta: int | None = None


class ExtractedRanking(BaseModel):
    platform: str
    board_type: str
    observed_date: date
    source_type: str = "article_citation"
    items: list[ExtractedRankItem] = Field(default_factory=list)


class ExtractedClaim(BaseModel):
    subject_type: str
    subject_name: str
    stance: str = "neutral"
    claim_text: str
    quote: str
    confidence: float = 0.0


class ExtractionResult(BaseModel):
    rankings: list[ExtractedRanking] = Field(default_factory=list)
    claims: list[ExtractedClaim] = Field(default_factory=list)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", "", text)


def extract_article(db: Session, article: Article) -> dict:
    payload = complete_json(
        SYSTEM_PROMPT,
        f"标题：{article.title}\n\n正文：\n{article.raw_text[:12000]}",
    )
    try:
        result = ExtractionResult.model_validate(payload)
    except ValidationError as exc:
        article.parse_status = "needs_review"
        article.failure_reason = f"抽取结果格式错误：{exc.errors()[:1]}"
        db.commit()
        return {"observation_count": 0, "claim_count": 0, "parse_status": article.parse_status}

    db.execute(delete(Observation).where(Observation.article_id == article.id))
    db.execute(delete(Claim).where(Claim.article_id == article.id))

    normalized_body = _normalize(article.raw_text)
    needs_review = False

    for ranking in result.rankings:
        for item in ranking.items:
            db.add(
                Observation(
                    article_id=article.id,
                    platform=ranking.platform,
                    board_type=ranking.board_type,
                    observed_date=ranking.observed_date,
                    rank=item.rank,
                    raw_game_name=item.name,
                    trend_raw=item.trend,
                    source_type=ranking.source_type,
                    confidence=1.0,
                )
            )

    for claim in result.claims:
        quote = claim.quote.strip()
        quote_found = bool(quote) and _normalize(quote) in normalized_body
        if not quote_found:
            needs_review = True
        db.add(
            Claim(
                article_id=article.id,
                subject_type=claim.subject_type,
                subject_name=claim.subject_name,
                claim_text=claim.claim_text,
                stance=claim.stance,
                confidence=claim.confidence,
                quote=quote,
                extracted_by="ai",
                verify_status="pending" if (not quote_found or claim.confidence < 0.7) else "confirmed",
                claimed_at=article.published_at,
            )
        )

    if not result.rankings and not result.claims:
        needs_review = True

    article.parse_status = "needs_review" if needs_review else "parsed"
    db.commit()

    return {
        "observation_count": sum(len(r.items) for r in result.rankings),
        "claim_count": len(result.claims),
        "parse_status": article.parse_status,
    }
```

`backend/app/schemas/digest.py`

```python
from pydantic import BaseModel


class ExtractResponse(BaseModel):
    observation_count: int
    claim_count: int
    parse_status: str
```

- [ ] **Step 5: 实现抽取接口**

`backend/app/api/ingest.py` 追加：

```python
@router.post("/articles/{article_id}/extract", response_model=ExtractResponse)
def extract(article_id: int, db: Session = Depends(get_db)) -> ExtractResponse:
    from fastapi import HTTPException

    from app.schemas.digest import ExtractResponse
    from app.services.extract import extract_article

    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return ExtractResponse(**extract_article(db, article))
```

注意：`router` 前缀是 `/api/ingest`，因此该接口路径实际为 `/api/ingest/articles/{id}/extract`。为了让测试中的 `/api/articles/{id}/extract` 生效，在 `backend/app/main.py` 中额外挂一个无前缀路由：

```python
from app.api.ingest import articles_router
...
    app.include_router(articles_router)
```

并在 `backend/app/api/ingest.py` 末尾追加：

```python
articles_router = APIRouter(
    prefix="/api/articles",
    tags=["articles"],
    dependencies=[Depends(require_user)],
)


@articles_router.post("/{article_id}/extract", response_model=ExtractResponse)
def extract_article_endpoint(article_id: int, db: Session = Depends(get_db)) -> ExtractResponse:
    from fastapi import HTTPException

    from app.services.extract import extract_article

    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return ExtractResponse(**extract_article(db, article))
```

同时删除上面重复的 `/articles/{article_id}/extract` 路由，只保留 `articles_router` 版本。`ExtractResponse` 在文件顶部统一导入。

- [ ] **Step 6: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_extract.py -v
```

预期：`3 passed`。

- [ ] **Step 7: 提交**

```powershell
git add backend
git commit -m "feat: LLM 抽取榜单与观点，引用校验"
```

---

### Task 8: 榜单归并引擎与冲突检测

**Files:**
- Create: `backend/app/services/merge.py`
- Test: `backend/tests/test_merge.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_merge.py`

```python
import json
from datetime import date

from sqlalchemy import select

from app.models import Conflict, Entry, Observation, Snapshot
from app.services.merge import merge_day

DAY = date(2026, 10, 16)


def _obs(db, rank, name, source_type, platform="douyin_mini", board="hot"):
    observation = Observation(
        article_id=1,
        platform=platform,
        board_type=board,
        observed_date=DAY,
        rank=rank,
        raw_game_name=name,
        source_type=source_type,
    )
    db.add(observation)
    return observation


def test_official_only_creates_confirmed_snapshot(db):
    _obs(db, 1, "羊了个羊", "official_original")
    _obs(db, 2, "合成大西瓜", "official_original")
    db.commit()

    result = merge_day(db, "douyin_mini", "hot", DAY)

    assert result.snapshot.status == "confirmed"
    assert result.snapshot.entry_count == 2
    assert db.scalar(select(Snapshot)).source_type == "official_original"
    assert len(db.scalars(select(Entry)).all()) == 2


def test_citation_and_official_conflict_is_recorded_not_overwritten(db):
    _obs(db, 1, "羊了个羊", "official_original")
    _obs(db, 3, "羊了个羊", "article_citation")
    db.commit()

    result = merge_day(db, "douyin_mini", "hot", DAY)

    entry = db.scalar(select(Entry))
    assert entry.rank == 1
    assert result.snapshot.source_type == "official_original"

    conflict = db.scalar(select(Conflict))
    assert conflict is not None
    assert conflict.conflict_type == "ranking"
    detail = json.loads(conflict.detail)
    assert detail["base"]["rank"] == 1
    assert detail["other"]["rank"] == 3


def test_multiple_citations_merge_into_one_entry_with_evidence(db):
    first = _obs(db, 2, "合成大西瓜", "article_citation")
    second = _obs(db, 2, "合成大西瓜", "article_citation")
    db.commit()

    result = merge_day(db, "douyin_mini", "hot", DAY)

    entry = db.scalar(select(Entry))
    assert result.snapshot.status == "provisional"
    assert entry.rank == 2
    assert sorted(json.loads(entry.evidence_ids)) == sorted([first.id, second.id])
    assert len(db.scalars(select(Entry)).all()) == 1


def test_merge_is_idempotent(db):
    _obs(db, 1, "羊了个羊", "official_original")
    _obs(db, 4, "羊了个羊", "article_citation")
    db.commit()

    merge_day(db, "douyin_mini", "hot", DAY)
    merge_day(db, "douyin_mini", "hot", DAY)

    assert len(db.scalars(select(Entry)).all()) == 1
    assert len(db.scalars(select(Conflict)).all()) == 1
    assert db.scalar(select(Snapshot)).entry_count == 1
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_merge.py -v
```

预期：导入错误，测试失败。

- [ ] **Step 3: 实现归并引擎**

`backend/app/services/merge.py`

```python
import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Conflict, Entry, Observation, Snapshot

SOURCE_PRIORITY = {"official_original": 3, "article_citation": 2, "manual": 1}
AUTHORITY = {"official_original": 1.0, "article_citation": 0.6, "manual": 0.4}


@dataclass
class MergeResult:
    snapshot: Snapshot
    conflicts: list[Conflict] = field(default_factory=list)
    created: bool = False


def _game_key(observation: Observation) -> str:
    if observation.game_id is not None:
        return f"id:{observation.game_id}"
    return re.sub(r"\s+", "", observation.raw_game_name).lower()


def merge_day(db: Session, platform: str, board_type: str, observed_date: date) -> MergeResult:
    observations = list(
        db.scalars(
            select(Observation).where(
                Observation.platform == platform,
                Observation.board_type == board_type,
                Observation.observed_date == observed_date,
            )
        )
    )
    if not observations:
        raise ValueError("没有可归并的观测")

    grouped: dict[str, list[Observation]] = defaultdict(list)
    for observation in observations:
        grouped[observation.source_type].append(observation)

    base_type = max(grouped, key=lambda item: SOURCE_PRIORITY.get(item, 0))
    snapshot = db.scalar(
        select(Snapshot).where(
            Snapshot.platform == platform,
            Snapshot.board_type == board_type,
            Snapshot.observed_date == observed_date,
            Snapshot.source_type == base_type,
        )
    )
    created = snapshot is None
    if snapshot is None:
        snapshot = Snapshot(
            platform=platform,
            board_type=board_type,
            observed_date=observed_date,
            source_type=base_type,
        )
        db.add(snapshot)
        db.flush()

    snapshot.authority_score = AUTHORITY.get(base_type, 0.4)
    snapshot.status = "confirmed" if base_type == "official_original" else "provisional"

    db.execute(delete(Entry).where(Entry.snapshot_id == snapshot.id))

    base_observations: dict[str, Observation] = {}
    for observation in grouped[base_type]:
        key = _game_key(observation)
        current = base_observations.get(key)
        if current is None or observation.rank < current.rank:
            base_observations[key] = observation

    entries: list[Entry] = []
    for key, observation in sorted(base_observations.items(), key=lambda item: item[1].rank):
        evidence = sorted(
            {
                item.id
                for item in grouped[base_type]
                if _game_key(item) == key
            }
        )
        entry = Entry(
            snapshot_id=snapshot.id,
            rank=observation.rank,
            game_id=observation.game_id,
            raw_name=observation.raw_game_name,
            evidence_ids=json.dumps(evidence),
        )
        db.add(entry)
        entries.append(entry)
        observation.snapshot_id = snapshot.id

    conflicts: list[Conflict] = []
    for source_type, items in grouped.items():
        if source_type == base_type:
            continue
        for observation in items:
            key = _game_key(observation)
            base = base_observations.get(key)
            if base is None or base.rank == observation.rank:
                continue
            subject_key = f"{platform}:{board_type}:{observed_date}:{key}"
            detail = json.dumps(
                {
                    "base": {"rank": base.rank, "source_type": base_type},
                    "other": {"rank": observation.rank, "source_type": source_type},
                },
                ensure_ascii=False,
            )
            existing = db.scalar(
                select(Conflict).where(
                    Conflict.subject_key == subject_key,
                    Conflict.conflict_type == "ranking",
                )
            )
            if existing is None:
                conflict = Conflict(
                    subject_type="ranking",
                    subject_key=subject_key,
                    window_start=observed_date,
                    window_end=observed_date,
                    conflict_type="ranking",
                    detail=detail,
                )
                db.add(conflict)
                conflicts.append(conflict)
            else:
                existing.detail = detail
                existing.status = "open"

    snapshot.entry_count = len(entries)
    db.commit()
    db.refresh(snapshot)
    return MergeResult(snapshot=snapshot, conflicts=conflicts, created=created)


def merge_all_for_date(db: Session, observed_date: date) -> list[MergeResult]:
    combos = db.execute(
        select(Observation.platform, Observation.board_type)
        .where(Observation.observed_date == observed_date)
        .distinct()
    ).all()
    return [merge_day(db, platform, board_type, observed_date) for platform, board_type in combos]
```

- [ ] **Step 4: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_merge.py -v
```

预期：`4 passed`。

- [ ] **Step 5: 提交**

```powershell
git add backend
git commit -m "feat: 榜单归并引擎与多源冲突检测"
```

---

### Task 9: 游戏归一、别名学习与游戏档案

**Files:**
- Modify: `backend/app/services/catalog.py`
- Create: `backend/app/api/games.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_catalog.py`

- [ ] **Step 1: 写失败测试**

`backend/tests/test_catalog.py`

```python
from datetime import date

from app.models import Alias, Category, Entry, Game, Observation, Snapshot
from app.services.catalog import normalize_name, resolve_game

HEADERS = {"Authorization": "Bearer dev-token"}


def test_resolve_game_by_canonical_name_and_alias(db):
    game = Game(canonical_name="羊了个羊")
    db.add(game)
    db.commit()
    db.add(Alias(game_id=game.id, alias="羊羊大作战"))
    db.commit()

    assert resolve_game(db, " 羊了个羊 ") == game
    assert resolve_game(db, "羊羊大作战") == game
    assert resolve_game(db, "不存在的游戏") is None
    assert normalize_name(" 羊 了 个 羊 ") == "羊了个羊"


def test_map_observation_learns_alias_and_profile_returns_history(client, db):
    category = Category(name="休闲益智", level=1)
    db.add(category)
    db.commit()

    game = Game(canonical_name="羊了个羊", category_id=category.id)
    db.add(game)
    db.commit()

    snapshot = Snapshot(
        platform="douyin_mini",
        board_type="hot",
        observed_date=date(2026, 10, 16),
        source_type="official_original",
        status="confirmed",
        entry_count=1,
    )
    db.add(snapshot)
    db.commit()

    entry = Entry(snapshot_id=snapshot.id, rank=3, raw_name="羊了个羊", game_id=game.id)
    observation = Observation(
        article_id=1,
        platform="douyin_mini",
        board_type="hot",
        observed_date=date(2026, 10, 16),
        rank=3,
        raw_game_name="羊羊大作战",
        source_type="article_citation",
    )
    db.add_all([entry, observation])
    db.commit()

    response = client.post(
        f"/api/review/observations/{observation.id}/map-game",
        json={"game_id": game.id},
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert db.get(Observation, observation.id).game_id == game.id
    assert db.query(Alias).filter(Alias.alias == "羊羊大作战").count() == 1

    profile = client.get(f"/api/games/{game.id}/profile", headers=HEADERS)
    assert profile.status_code == 200
    body = profile.json()
    assert body["game"]["canonical_name"] == "羊了个羊"
    assert body["stats"]["best_rank"] == 3
    assert body["stats"]["days_on_board"] == 1
    assert body["history"][0]["rank"] == 3
```

- [ ] **Step 2: 运行测试确认失败**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_catalog.py -v
```

预期：导入错误或 `404`，测试失败。

- [ ] **Step 3: 实现游戏归一与档案聚合**

在 `backend/app/services/catalog.py` 追加：

```python
import json
import re

from app.models import Alias, Claim, Entry, Game, Observation, Snapshot


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", "", name).lower()


def resolve_game(db: Session, raw_name: str) -> Game | None:
    key = normalize_name(raw_name)
    for alias in db.scalars(select(Alias)):
        if normalize_name(alias.alias) == key:
            return db.get(Game, alias.game_id)
    for game in db.scalars(select(Game)):
        if normalize_name(game.canonical_name) == key:
            return game
    return None


def map_observation_to_game(
    db: Session,
    observation_id: int,
    game_id: int | None = None,
    new_game_name: str | None = None,
    category_id: int | None = None,
    actor: str = "operator",
) -> Observation:
    from fastapi import HTTPException

    observation = db.get(Observation, observation_id)
    if observation is None:
        raise HTTPException(status_code=404, detail="观测不存在")

    if game_id is not None:
        game = db.get(Game, game_id)
        if game is None:
            raise HTTPException(status_code=404, detail="游戏不存在")
    elif new_game_name:
        game = Game(
            canonical_name=new_game_name,
            category_id=category_id,
            category_source="human",
        )
        db.add(game)
        db.flush()
    else:
        raise HTTPException(status_code=400, detail="必须指定 game_id 或 new_game_name")

    observation.game_id = game.id
    key = normalize_name(observation.raw_game_name)
    exists = db.scalar(
        select(Alias).where(
            Alias.game_id == game.id,
            Alias.alias == observation.raw_game_name,
        )
    )
    if exists is None and key != normalize_name(game.canonical_name):
        db.add(
            Alias(
                game_id=game.id,
                alias=observation.raw_game_name,
                source_id=None,
                alias_type="article",
                confirmed_by=actor,
            )
        )
    db.commit()
    db.refresh(observation)
    return observation


def game_profile(db: Session, game_id: int) -> dict:
    from fastapi import HTTPException

    game = db.get(Game, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="游戏不存在")

    rows = db.execute(
        select(Entry, Snapshot)
        .join(Snapshot, Entry.snapshot_id == Snapshot.id)
        .where(Entry.game_id == game_id)
        .order_by(Snapshot.observed_date.desc(), Entry.rank)
    ).all()

    history = []
    dates: set = set()
    best_rank: int | None = None
    for entry, snapshot in rows:
        dates.add(snapshot.observed_date)
        best_rank = entry.rank if best_rank is None else min(best_rank, entry.rank)
        history.append(
            {
                "date": snapshot.observed_date.isoformat(),
                "platform": snapshot.platform,
                "board_type": snapshot.board_type,
                "rank": entry.rank,
                "source_type": snapshot.source_type,
                "snapshot_id": snapshot.id,
            }
        )

    claims = list(
        db.scalars(
            select(Claim)
            .where(Claim.subject_id == game_id)
            .order_by(Claim.created_at.desc())
        )
    )
    aliases = list(db.scalars(select(Alias).where(Alias.game_id == game_id)))

    return {
        "game": {
            "id": game.id,
            "canonical_name": game.canonical_name,
            "publisher": game.publisher,
            "developer": game.developer,
            "platforms": game.platforms,
            "release_date": game.release_date.isoformat() if game.release_date else None,
            "online_status": game.online_status,
            "category_id": game.category_id,
        },
        "stats": {
            "best_rank": best_rank,
            "days_on_board": len(dates),
            "claim_count": len(claims),
        },
        "history": history,
        "aliases": [{"id": a.id, "alias": a.alias, "type": a.alias_type} for a in aliases],
        "claims": [
            {
                "id": c.id,
                "text": c.claim_text,
                "stance": c.stance,
                "status": c.verify_status,
                "quote": c.quote,
            }
            for c in claims
        ],
    }
```

在 `backend/app/services/catalog.py` 顶部补齐导入（保留已有的 `HTTPException`、`select`、`Session`、`Category`）：

```python
from sqlalchemy import select
from sqlalchemy.orm import Session
```

- [ ] **Step 4: 实现游戏与待核接口**

`backend/app/api/games.py`

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_user
from app.models import Game
from app.services.catalog import game_profile

router = APIRouter(prefix="/api/games", tags=["games"], dependencies=[Depends(require_user)])


class GameCreate(BaseModel):
    canonical_name: str
    category_id: int | None = None
    publisher: str | None = None
    developer: str | None = None
    platforms: str = ""


@router.get("")
def list_games(query: str = "", db: Session = Depends(get_db)) -> list[dict]:
    statement = select(Game).order_by(Game.id.desc())
    if query:
        statement = statement.where(Game.canonical_name.contains(query))
    return [
        {
            "id": game.id,
            "canonical_name": game.canonical_name,
            "category_id": game.category_id,
            "publisher": game.publisher,
        }
        for game in db.scalars(statement)
    ]


@router.post("", status_code=201)
def create_game(payload: GameCreate, db: Session = Depends(get_db)) -> dict:
    game = Game(**payload.model_dump(), category_source="human")
    db.add(game)
    db.commit()
    db.refresh(game)
    return {"id": game.id, "canonical_name": game.canonical_name}


@router.get("/{game_id}/profile")
def profile(game_id: int, db: Session = Depends(get_db)) -> dict:
    return game_profile(db, game_id)
```

`backend/app/api/review.py`

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_user
from app.services.catalog import map_observation_to_game

router = APIRouter(prefix="/api/review", tags=["review"], dependencies=[Depends(require_user)])


class MapGameRequest(BaseModel):
    game_id: int | None = None
    new_game_name: str | None = None
    category_id: int | None = None


@router.post("/observations/{observation_id}/map-game")
def map_game(observation_id: int, payload: MapGameRequest, db: Session = Depends(get_db)) -> dict:
    observation = map_observation_to_game(
        db,
        observation_id,
        game_id=payload.game_id,
        new_game_name=payload.new_game_name,
        category_id=payload.category_id,
    )
    return {"id": observation.id, "game_id": observation.game_id}
```

`backend/app/main.py` 增加：

```python
from app.api.games import router as games_router
from app.api.review import router as review_router
...
    app.include_router(games_router)
    app.include_router(review_router)
```

- [ ] **Step 5: 运行测试确认通过**

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_catalog.py -v
```

预期：`2 passed`。

- [ ] **Step 6: 提交**

```powershell
git add backend
git commit -m "feat: 游戏归一、别名学习与游戏档案"
```
