# 交互式课件更新指南

> ExamMaster 课件的开发、部署、入库、验证流程。
> 使用前确保已安装 [course-forge](https://github.com/xmwengxing/course-forge) skill。

---

## 速查

| 项 | 值 |
|---|---|
| 课件工程 | `ai-trainer-course/presentation/`（不入 git） |
| 课件源码 | `presentation/src/chapters/` — 每章一个目录 |
| 课程结构 | `presentation/public/course.json` |
| 源文档 | `ai-trainer-course/docs/` |
| 本地预览 | `http://localhost:5173/?auto=1`（dev）/ `http://localhost:9080/courses/ai-trainer/embed.html`（Docker） |
| 部署脚本 | `python3 deploy-courses.sh`（仅课件）/ `python3 deploy.sh`（全站） |

---

## 目录结构

```
ExamMaster/
├── ai-trainer-course/
│   ├── course.json                    # 课程结构（section > segment > chapter）
│   ├── docs/                          # 源文档（口播稿）
│   ├── presentation/                  # Vite + React + TS
│   │   ├── src/
│   │   │   ├── chapters/             # 每章一个目录
│   │   │   ├── registry/chapters.ts  # 章节注册（脚本自动生成，勿手动编辑）
│   │   │   ├── components/           # 共享组件
│   │   │   ├── hooks/                # 共享 hooks
│   │   │   └── styles/tokens.css     # 主题 tokens
│   │   ├── public/
│   │   │   ├── audio/                # TTS 合成 MP3
│   │   │   └── subtitle-timing.json  # 字幕时序
│   │   └── scripts/                  # extract-narrations / synthesize / compress / subtitle
│   └── deploy-courses.sh             # 课件增量部署
├── public/courses/ai-trainer/         # Vite build 输出至此后 nginx 可直接访问
└── dist/courses/ai-trainer/           # Docker nginx 的只读挂载目录
```

---

## 开发流程

### 1. 源文档
口播稿放入 `ai-trainer-course/docs/`，文件名建议使用 `<编号> <标题>.md`。

### 2. 课件开发
在 `presentation/src/chapters/` 下创建章节目录（编号全局递增）：

```
chapters/NNN-<prefix>-<id>/
├── index.tsx       # 画面组件（step >= N 渐进揭示）
├── index.css       # 独立 CSS 前缀
└── narrations.ts   # 口播文本数组
```

章节开发完成后，运行注册脚本自动生成 `chapters.ts` 和更新 `course.json`：

```bash
cd presentation/src
python3 generate-registry.py    # 扫描 chapters/ 全量注册
```

### 2.1 在已有课程中增补章节（插入到中间位置）

当需要在已有课程的 S1-S5 之间插入新章节（如 S6 知识点加深）时，需注意**章节编号冲突**问题：

**原理**：章节目录 `src/chapters/` 以 `{编号}-{前缀}-{描述}` 命名（如 `483-f1-scifi-bubble`）。章节在课程列表中的**排序由目录名字母顺序决定**，而非 `course.json`。两个章节使用相同编号会导致排序后交叉排列，播放顺序错乱。

**排序规则**：目录名按字符串排序。`654-m1-farewell` < `654a-m1-anti-crawl` < `655-m2-lab-vs-real`（因为 `-` < `a` 且 `4` < `5`）。

**插入方案**：
1. 确定新章节应位于哪两个目录之间
2. 如前后编号相邻无空隙，可在前一个编号后加字母后缀：例如在 `654-` 和 `655-` 之间可用 `654a-`、`654b-` 等
3. **方案 B**：使用大于当前最大编号的数字追加到末尾，在 course.json 中归入正确课程段
4. **音频目录不受影响**：音频存在 `public/audio/<章节ID>/`（按 ID 非编号），编号变更后无需移动或重合成音频

**同步到主项目**：
- 增补章节仅涉及课件工程（`ai-trainer-course/presentation/`），不需要修改 `ExamMaster/` 主项目的代码
- 更新 `course-*.json` 后需重新构建部署
- 已有课程的 `start_chapter` 可能变化 → 管理员需重新「同步课件章节」

### 3. 验收
```bash
cd presentation
npm run dev                     # → http://localhost:5173/?auto=1
```

### 4. 音频合成
```bash
cd presentation
npm run extract-narrations

# 增量合成（推荐 — 只生成缺失音频，跳过已有）
MINIMAX_API_KEY=<key> npm run synthesize-audio

# 全量重合成（仅当更换音色或重新切分口播时使用）
# 合成脚本按 audio-segments.json 顺序遍历所有章节，不加 --force 时自动跳过已有 MP3
# MINIMAX_API_KEY=<key> npm run synthesize-audio -- --force

bash scripts/compress-audio.sh --preset high     # 可选：64kbps 压缩
python3 scripts/subtitle-timing.py
```
> **注意**：合成脚本读取 `audio-segments.json`（由 extract-narrations 生成），按序遍历全部章节。增量新增章节目录后直接运行 `npm run synthesize-audio` 即可，不加 `--force` 不会重复合成已有音频。

### 5. 构建
```bash
npm run build    # → dist/
```

### 6. 入库

**推荐方式**：管理员在交互式课堂中点击「**同步课件章节**」，系统自动读取 `course.json`，对比 DB，INSERT 缺失条目（title / start_chapter / sort_order 全部自动填入）。

> **映射规则**：同步函数按课程组名匹配 JSON 文件。组名包含"四级"则读取 `course-l4.json`，其他读取 `course.json`。四级课程组必须确保组名含"四级"字样。

> **数据源问题排查**：如果同步后未出现新章节，检查 API 日志：
> ```bash
> docker logs examaster_api 2>&1 | grep detect
> ```
> 常见原因：`interactive_course_groups` 表查询的列名不匹配（同步代码查询 `name` 列，但表结构为 `title` 列）。确保 `src/services/interactive-courses.service.js` 中为 `SELECT title`。

**手动 SQL 备用**：
```sql
INSERT INTO interactive_courses
  (id, title, description, base_path, status, sort_order, group_id, start_chapter)
VALUES (
  'course-<id>', '<标题>', '<简介>',
  'courses/ai-trainer/', 'published', <序号>,
  '<group_id>', <start_chapter>
);
```
`start_chapter` = 该课第一个章节在全局 `chapters` 数组中的起始下标。

### 7. 本地验证

课件构建后无需嵌入主项目即可独立预览：

```bash
npx serve dist                        # 或其他静态文件服务
# → http://localhost:3000/?auto=1
```

嵌入主项目后验证：

```bash
curl -o /dev/null -w "%{http_code}" http://localhost:9080/courses/ai-trainer/embed.html
# → 200
```

### 8. 部署至服务器
```bash
python3 deploy-courses.sh             # rsync 课件至服务器
python3 deploy.sh                     # 全站部署（含主应用代码）
```

---

## 嵌入 URL

```
/courses/ai-trainer/embed.html?auto=1&chapter=<start_chapter>
```

| 参数 | 说明 |
|------|------|
| `auto=1` | 自动播放模式 |
| `chapter=N` | 从第 N 章开始（0-indexed） |

---

## 多色语义

课件组件可使用以下语义色，在不同主题下自动适配：

| 变量 | 用途 |
|------|------|
| `--accent` | 核心概念 / 金句 |
| `--accent-tech` | 技术元素 / 工具 |
| `--accent-good` | 正向结论 / 最佳实践 |
| `--accent-warn` | 警告 / 风险 / 红线 |
| `--accent-deep` | 进阶 / 理论深度 |

---

## 关键陷阱

| 问题 | 原因 | 修复 |
|------|------|------|
| 导航菜单消失 | `course.json` JSON 损坏 | 用脚本重新生成，勿手动编辑 |
| 章节卡片跳错位置 | DB 中 `start_chapter` 填错 | SQL UPDATE 或用「同步课件章节」自动更正 |
| 字幕与音频不同步 | narrations 修改后未重新合成 | 重跑 extract → synthesize → subtitle-timing |
| 本地 nginx 看不到更新 | 课件文件未进入 `dist/` | 运行 `deploy-courses.sh`（自动 build + copy + dist 同步） |
| **插入章节后播放跳到其他课程** | 章节目录编号冲突（两个课程用了同号） | 检查 `ls {编号}-*/` 是否有多目录；移新章到未占用编号 |

---

## 多课程部署（可选）

当需要在一个 presentation 项目中承载多套课程体系（如不同等级、不同主题）时，推荐以下方式：

### 架构
- **单构建**：所有课程共享同一套 Vite 项目、组件库和 hooks
- **课程隔离**：各课程使用独立的 `course-*.json` 和主题，通过 URL 参数切换

### 课程结构
```
presentation/public/
├── course.json           # 默认课程结构
├── course-<level>.json   # 其他课程结构
```

### URL 参数
```
embed.html?course=<level>&auto=1&chapter=<start>
```
`course` 参数缺省时加载 `course.json`。

### App 适配
`App.tsx` 根据 `course` 参数：
- 设置 `<html data-theme="...">` 切换主题
- 加载对应的 `course-*.json`
- 按课程过滤章节列表（防止跨课程跳转）

### 主题
多套主题共存于 `tokens.css`，通过 CSS 属性选择器隔离：

```css
[data-theme="dark"]  { --surface: #1e1e24; --text: #f4f4f5; }
[data-theme="light"] { --surface: #f1ebd8; --text: #14110b; }
```

章节组件使用语义 token（`var(--text)` 等）自动适配。UI 组件（菜单、字幕、控制栏）使用硬编码颜色以保证跨主题可读。

### 新增课程体系 Checklist
1. 创建 `course-<level>.json`
2. 在 `tokens.css` 中新增对应 `[data-theme]` 块
3. 在 `App.tsx` URL 参数映射中添加 course → JSON + theme + 章节前缀过滤
4. 在 `embed.html` 内联脚本中添加 theme 初始化逻辑
5. 在 DB 中创建课程组（管理员前端操作）
6. 在 `interactive-courses.service.js` 的 `detectAndCreateChapters` 中添加组名到 JSON 文件的匹配规则
7. 新课件章节的 ID 前缀在 `App.tsx:filterChapters` 白名单中注册
