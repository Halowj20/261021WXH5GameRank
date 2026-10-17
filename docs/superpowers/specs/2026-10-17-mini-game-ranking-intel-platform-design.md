# 微小 / 抖小游戏榜单情报平台 · 设计文档

- 日期：2026-10-17
- 状态：已定稿（待实施）
- 使用者：平台运营团队（5-10 人）

## 1. 背景与问题

平台运营每天需要阅读 10+ 个微信公众号、20+ 篇关于微信小游戏与抖音小游戏榜单的分析文章。当前存在四个问题：

1. 信息源分散，读完即散，第二天的结论找不到前一天的依据。
2. 各公众号的表述口径不一，同一款游戏、同一个品类有多种叫法，无法直接对比。
3. 榜单多以截图形式出现，无法检索、无法统计。
4. 观点埋在长文里，无法快速回答"这款游戏最近被怎么评价"。

目标不是做一个阅读器，而是把「分散的解读」沉淀成「可交叉验证、可回溯、可输出的情报」。

## 2. 目标与非目标

### 目标

1. 每天 20+ 篇文章可在一次投喂流程内完成入库、抽取、归类。
2. 榜单事实可被多家来源交叉验证，冲突可见、不被静默合并。
3. 游戏维度可长期追踪：排名履历、品类归属、观点档案。
4. 每天可生成一份带来源引用的日报初稿，人工定稿后导出。
5. 所有结论均可回溯到原文段落或原始截图。

### 非目标（本期不做）

1. 不做公众号全自动定时抓取（预留适配器接口）。
2. 不做买量/投放数据接入。
3. 不做对外公开发布站点。
4. 不做移动端 App。

## 3. 用户与场景

| 角色 | 主要动作 |
|---|---|
| 运营（主用户） | 投喂文章、确认待核项、编辑定稿日报 |
| 团队负责人 | 查看看板与日报、抽查来源 |
| 管理员 | 维护公众号、品类树、成员与模型配置 |

核心日常流程：早上投喂昨日/当日文章 → 处理待核队列 → 打开日报初稿 → 删改定调 → 定稿导出。

## 4. 总体架构：五层数据模型

| 层 | 内容 | 原则 |
|---|---|---|
| 原始层 | Source、Article、Asset | 只追加、不改写，作为溯源底座 |
| 事实层 | Observation、Snapshot、Entry | 排名是客观事实，可多源佐证 |
| 主数据层 | Game、Alias、Category、Tag | 解决多口径归一 |
| 观点层 | Claim、Conflict | 观点与事实分离，可标注核实状态 |
| 产物层 | Digest、DigestItem、AuditLog | 日报可回滚、可追责 |

核心关系：

- 一篇 Article 产生多个 Observation。
- 多个 Observation 按「平台 + 榜种 + 日期 + 游戏」归并为一个 Snapshot 的 Entry，并保留全部出处。
- 一篇 Article 产生多个 Claim；一个 Game 可对应多个 Alias。
- 一个 Digest 引用多个 Snapshot / Claim。

## 5. 数据模型

### 5.1 原始层

**Source（公众号）**：`id, name, platforms(wechat_mini|douyin_mini), weight, status, note`

**Article（文章）**：`id, source_id, title, url, published_at, fetched_at, raw_text, raw_html, ingest_method(link|screenshot|fulltext), content_hash, parse_status(pending|parsed|failed|needs_review), failure_reason`

**Asset（素材）**：`id, article_id, type(screenshot|table|cover), file_path, ocr_text, ocr_confidence`

### 5.2 事实层

**Observation（榜单观测）**：`id, article_id, asset_id, platform, board_type, observed_date, rank, raw_game_name, trend_raw, source_type, confidence`

**Snapshot（榜单快照）**：`id, platform, board_type, observed_date, source_type, authority_score, entry_count, status(provisional|confirmed)`

同一「平台 + 榜种 + 日期」可存在多份 Snapshot，但按 `source_type` 区分主次。

**Entry（榜单条目）**：`id, snapshot_id, rank, game_id, raw_name, trend(up|down|new|out|flat), delta, evidence_observation_ids`

### 5.3 主数据层

**Game（游戏）**：`id, canonical_name, publisher_id, developer_id, platforms, release_date, online_status, has_isbn, first_seen_at, last_seen_at, category_path_id, category_source(ai|human), quality_flags`

**Alias（别名）**：`id, game_id, alias, source_id, alias_type(official|article|abbr), confirmed_by, confirmed_at`

**Category（品类，三级）**：`id, parent_id, level(1|2|3), name, sort, status`

**Tag（标签）**：`id, name, dimension(gameplay|theme|art|monetization|lifecycle), status`

**GameTag**：`game_id, tag_id`

**CategoryMapping（口径映射）**：`id, source_id, raw_category_text, category_id, confirmed_by`

### 5.4 观点层

**Claim（观点）**：`id, article_id, subject_type(game|category|market), subject_id, claim_text, stance(positive|negative|neutral), confidence, quote, quote_start, quote_end, extracted_by(ai|human), verify_status(pending|confirmed|disputed), created_at`

**Conflict（分歧）**：`id, subject_type, subject_id, window_start, window_end, claim_ids, conflict_type(judgement|ranking), status(open|resolved)`

### 5.5 产物层

**Digest（日报）**：`id, digest_date, status(draft|reviewed|published), generated_at, editor_id, version`

**DigestItem**：`id, digest_id, section, order, ref_type(snapshot|claim|conflict), ref_id, text_override, editor_note`

**AuditLog**：`id, actor_id, action, entity_type, entity_id, before, after, created_at`

## 6. 投喂与解析管道

### 6.1 三个通道

1. **链接**：粘贴公众号文章 URL，支持一次多条。
2. **截图**：拖拽或 Ctrl+V 贴图，OCR 后还原表格结构。
3. **全文兜底**：抓取失败时整段粘贴，走同一套解析。

三通道最终产出统一的 `ParseBundle`（标题、正文、图片、表格候选），下游不区分来源。

### 6.2 管道状态

`received → fetched → parsed → deduped → extracted → categorized → review_required → published`

每一步失败都保留失败原因并支持重试，不允许任务静默丢失。

### 6.3 去重

- URL 精确去重。
- 正文 `content_hash` 指纹去重，处理同一文章被多个号转载。
- 重复投喂时提示「已存在」并给出跳转。

### 6.4 抽取

AI 抽取输出结构化 JSON，包含：

```json
{
  "rankings": [
    {"platform": "douyin_mini", "board_type": "hot", "observed_date": "2026-10-16",
     "source_type": "article_citation", "items": [{"rank": 1, "name": "示例游戏", "trend": "up", "delta": 3}]}
  ],
  "claims": [
    {"subject_type": "game", "subject_name": "示例游戏", "stance": "positive",
     "claim_text": "…", "quote": "…", "confidence": 0.82}
  ]
}
```

硬约束：每条 `claim` 必须带 `quote`；无引用的判断不入观点库。低置信度（默认 < 0.7）进入待核区。

## 7. 榜单归并与来源区分

`source_type` 取值：

| 值 | 含义 |
|---|---|
| `official_original` | 官方榜单原始数据或截图 |
| `article_citation` | 公众号转述引用 |
| `manual` | 人工整理或估算 |

归并规则：

1. 同一「平台 + 榜种 + 日期」下，`official_original` 优先作为基准快照。
2. 转述不覆盖官方，作为校验证据挂载；名次不一致时生成 `ranking` 类型 Conflict 并标红。
3. 当天仅有转述时，快照可生成，但状态为 `provisional`，日报中标注「未经官方核对」。
4. 每个 Entry 保留 `evidence_observation_ids`，可点回原文或截图。
5. 统计口径以基准快照为准，重复转述不重复计数。

## 8. 品类体系

### 8.1 结构

三级自关联树，L1 定大盘、L2 定玩法、L3 定结构。

示例：

| L1 | L2 | L3 |
|---|---|---|
| 休闲益智 | 消除 | 三消 / 合成消除 / 连线消除 |
| 休闲益智 | 合成 | 合成经营 / 纯合成 |
| 策略 | 塔防 | 放置塔防 / 传统塔防 |
| 模拟经营 | 经营养成 | 餐厅 / 农场 / 医院 |
| 角色扮演 | 放置RPG | 挂机 / 卡牌放置 |

### 8.2 归属规则

1. L1、L2 必填；进日报的游戏 L3 必填，长尾游戏可停在 L2 并进待核区。
2. 一个游戏只有一条主品类路径，避免统计重复计数。
3. 题材、美术、变现、生命周期阶段走 Tag，不进入品类树。
4. 公众号原始叫法写入 CategoryMapping，人工确认后复用。

## 9. 游戏档案（七个维度）

| 维度 | 内容 | 维护方式 |
|---|---|---|
| 基础身份 | 主名、别名、发行商、研发商、平台、上线日期、运营状态、版号 | AI 抽取 + 人工确认 |
| 品类身份 | 三级路径、标签组、原始口径映射、归类置信度 | AI 建议 + 人工确认 |
| 榜单履历 | 当前名次、历史最佳、在榜天数、连续在榜、近 7 日变化、新进/掉榜事件、来源类型 | 系统计算 |
| 观点档案 | 已确认、分歧中、待核实、观点时间线、被提及次数、信源分布 | 系统汇总 |
| 关联关系 | 同厂商、同 IP、同品类竞品、玩法相似、同批次新游 | 自动推荐 + 人工确认 |
| 素材溯源 | 关联文章、引用片段、榜单截图、首次/最近提及 | 系统汇总 |
| 数据质量 | 别名冲突、待核条目数、来源覆盖度、品类待补 | 系统计算 |

**GameRelation**：`id, game_a_id, game_b_id, relation_type(same_publisher|same_ip|competitor|similar_gameplay|same_batch), score, source(auto|human), confirmed_by, status(suggested|confirmed|ignored)`

相似度推荐依据：主品类路径距离、标签重合度、同厂商。仅作为建议，确认后才生效。

## 10. 观点库与分歧

- Claim 按对象聚合：游戏、品类、大盘。
- 同一对象在时间窗内出现相反 `stance` 时生成 Conflict，保留双方原文引用。
- 核实状态三档：待核实、已确认、有分歧。
- 观点在日报中可按「信源权重 × 时间新鲜度」排序。

## 11. 日报生成与定稿

### 11.1 生成逻辑

1. 取当日基准快照，计算异动：新进榜、掉榜、名次跃迁（默认 ±5）。
2. 关联异动游戏与品类上的 Claim，按信源权重与分歧情况排序。
3. 汇总品类结构变化（哪些 L1/L2 上榜数量变化）。
4. 生成初稿，每个条目挂来源引用。

### 11.2 日报结构

- 今日概览（3-5 条关键变化）
- 微信小游戏榜
- 抖音小游戏榜
- 品类动态
- 值得关注的观点（含分歧）
- 待核实事项

### 11.3 定稿

- 支持逐条勾选、删除、改写、调整顺序。
- `text_override` 与 `editor_note` 与自动生成内容分离保存。
- 状态流转：草稿 → 已定稿 → 已发布。
- 导出格式：Markdown（一期），飞书文档（二期）。

## 12. 页面模块

| 模块 | 作用 | 关键点 |
|---|---|---|
| 今日工作台 | 每日第一屏 | 待核队列、今日异动、日报进度 |
| 投喂台 | 三通道输入 | 解析预览后再入库，支持批量 |
| 榜单中心 | 按平台 + 榜种 + 日期查看 | 官方与转述并列，差异标红 |
| 游戏库 | 游戏档案 | 七维信息、排名曲线、关联关系 |
| 日报编辑器 | 初稿到定稿 | 逐条勾选改写、来源可见、一键导出 |
| 设置 | 基础配置 | 公众号、品类树、标签、模型、成员 |

## 13. 技术选型

- 前端：React + TypeScript + Vite + Ant Design
- 后端：Python FastAPI + SQLAlchemy
- 数据库：SQLite（本机起步），预留 PostgreSQL 迁移
- 任务：进程内任务队列 + 重试，不引入 Redis
- 文件：本地目录按日期分桶
- OCR：驱动可切换（PaddleOCR 本地 / 云 OCR）
- 模型：OpenAI 兼容接口，`base_url`、`api_key`、`model` 可配置
- 部署：本机单进程跑通，后续可容器化部署到内网服务器

## 14. 异常处理

| 异常 | 处理 |
|---|---|
| 文章抓取失败 | 转全文粘贴通道，记录失败原因 |
| OCR 置信度低 | 进入待核区，支持人工框选表头列 |
| 多源名次冲突 | 生成 Conflict，不自动选边 |
| 模型调用失败 | 重试 3 次，仍失败则只入事实、不出观点，并在日报标注 |
| 重复投喂 | URL + 指纹双去重，提示已存在 |
| 品类无法判定 | 停在 L2 或标记未分类，进待核区 |

## 15. MVP 范围

**P0（第一版）**：三通道投喂、抽取与归并、游戏与别名、三级品类、榜单来源类型、待核区、游戏档案基础版、日报生成与导出、简单登录。

**P1**：排名趋势图、品类结构看板、信源权重、分歧提示、日报历史对比、关联关系推荐。

**P2**：定时自动抓取、飞书文档同步、周报/月报。

## 16. 验收标准

1. 一次投喂 20 篇文章可完成解析入库，人工待核率低于 30%。
2. 从数据到日报初稿 1 分钟内，人工定稿控制在 20 分钟内。
3. 日报每条结论可点击回溯到原文或截图。
4. 同一榜单被多家转述时，统计只计一次。
5. 同一游戏的多口径名称可归一，别名可在档案中查看来源。

## 17. 风险与待定事项

| 事项 | 说明 |
|---|---|
| 公众号正文抓取稳定性 | 无官方接口，链接通道可能失败；已用全文粘贴兜底 |
| OCR 表格还原准确率 | 复杂榜单截图可能错行，需人工校核 |
| 模型成本 | 20+ 篇/天的抽取成本需在设置页给出用量统计 |
| 品类树初期覆盖 | 冷启动阶段可能大量落入"未分类"，需要一次集中梳理 |
| 团队权限 | 一期只做简单登录与角色，细粒度权限放二期 |
