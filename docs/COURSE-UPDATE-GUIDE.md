# 交互式课件开发与更新指南

> ExamMaster 课件的开发、部署、入库、验证流程。
> 课件开发遵循 [course-forge](https://github.com/xmwengxing/course-forge) skill 规范。

---

## 速查

| 项 | 值 |
|---|---|
| 课件工程 | `ai-trainer-course/presentation/` |
| 课件源码 | `presentation/src/chapters/` — 每章一个目录 |
| 课程结构 | `presentation/public/course.json` — 默认课程；`course-{id}.json` — 扩展课程 |
| 源文档 | `ai-trainer-course/docs/` |
| 素材目录 | `docs/materials/` — 场景截图、模板等按名称引用 |
| 本地预览 | `http://localhost:5173/?auto=1`（dev）/ `http://localhost:9080/courses/ai-trainer/embed.html`（Docker） |
| 部署脚本 | `python3 deploy-courses.sh`（仅课件） |

---

## 目录结构

```
ai-trainer-course/
├── course.json / course-{id}.json    # 课程结构（课 → 段 → 章）
├── docs/                             # 源文档（口播稿）
│   ├── <课程名>.md
│   └── materials/                    # 素材（截图、模板等）
├── presentation/
│   ├── src/
│   │   ├── chapters/                 # 每章 `<编号>-<前缀>-<id>/`
│   │   │   ├── index.tsx             # 画面组件（step >= N 渐进揭示）
│   │   │   ├── index.css             # 独立 CSS 前缀（2~4 字母）
│   │   │   └── narrations.ts         # 口播文本数组（☆ 唯一真相源）
│   │   ├── registry/chapters.ts      # 全局章节注册（脚本自动生成）
│   │   ├── components/               # 共享组件
│   │   ├── hooks/                    # 共享 hooks
│   │   └── styles/                   # tokens / base / animations
│   ├── public/
│   │   ├── audio/                    # TTS 合成 MP3
│   │   └── subtitle-timing.json      # 字幕时序
│   └── scripts/                      # 合成/字幕/录屏
└── dist/                             # Vite 构建产物（纯静态）
```

---

## 开发流程

### 1. 源文档 + 素材

口播稿放入 `docs/<课程名>.md`。课件中提到的真实场景截图、模板文件等放入 `docs/materials/`，开发时按文件名引用。

### 2. 课件开发

#### 单章结构

在 `presentation/src/chapters/` 下创建章节目录：

```
chapters/<编号>-<前缀>-<id>/
├── index.tsx       # 画面组件
├── index.css       # 独立 CSS 前缀（2~4 字母，不跨章复用）
└── narrations.ts   # `export const narrations: string[]`
```
#### 章节注册

章节目录创建完成后，运行注册脚本自动生成 `chapters.ts`：

```bash
cd presentation
# 脚本扫描 src/chapters/ → 自动生成 src/registry/chapters.ts
# 超过 50 章时 Component 使用 React.lazy 按需加载
```

**注意**：`chapters.ts` 由脚本自动生成，**不要手动编辑**。新增章节后会触发 code-split —— 每章拆为独立 JS chunk，首屏只加载当前课程所需的章节。

#### 章节编号与插入

章节目录 `{编号}-{前缀}-{id}`，排序由目录名字母序决定。

| 场景 | 方法 |
|:--|:--|
| 前后有数字空隙 | 直接使用间隙编号 |
| 编号相邻无空隙 | 前编号后加字母后缀（`674a-`, `674b-`...） |
| 区间已满 | 挪到末尾用更大编号 |

```bash
# 验证无编号冲突
ls {编号}-*/ | sort
```

音频目录基于章节 ID（非编号），重编号后无需移动音频。

### 3. 验收

```bash
cd presentation
npm run dev                     # → http://localhost:5173/?auto=1
```

### 4. 音频合成

```bash
cd presentation
npm run extract-narrations

# 全量增量合成（跳过已有 MP3）
MINIMAX_API_KEY=<key> npm run synthesize-audio

# 仅合成指定章节（避免全量遍历）
MINIMAX_API_KEY=<key> npm run synthesize-audio -- --chapters=id1,id2
```

> 合成脚本读取 `audio-segments.json`。不加 `--force` 不会重复合成已有音频。

#### 字幕时序（双模式）

```bash
# 默认模式 — 80 字句界 + 字数占比分配时长 + ffprobe 实测总长
python3 scripts/subtitle-timing.py

# MiniMax 词级模式 — 利用 TTS 返回的逐词 ms 精准对齐（推荐）
python3 scripts/subtitle-timing.py --mode minimax

# 仅处理指定章节（避免全量扫描超时）
python3 scripts/subtitle-timing.py --mode minimax --chapters id1 id2
```

> MiniMax 合成时自动请求词级时间戳，若模型未返回则降级 warning，不影响音频生成。

#### 音频压缩（可选）

```bash
bash scripts/compress-audio.sh --preset high     # 64kbps，语音透明，↓50%
```

> 压缩不影响音频时长，字幕无需重新生成。

### 5. 构建 + 部署

```bash
npm run build                        # → dist/
python3 deploy-courses.sh            # upload → 生产服务器
```

### 6. 录屏为视频（可选）

```bash
# Playwright 录制 — 仅录课件画布内容（不录导航/控制栏）
node scripts/record.js --dev --duration 120            # 开发模式 2 分钟
node scripts/record.js --headless --out demo.mp4       # 无头模式
node scripts/record.js --url "http://exammaster.zzzjl.com/courses/ai-trainer/embed.html?auto=1&recording=1"
```

URL 加 `?recording=1` 自动隐藏所有 UI 控件，纯画布录制。

---

## 入库

部署后管理员在交互式课堂后台点击「**同步课件章节**」，系统自动读取 `course.json`，对比 DB 并插入缺失条目。

> 四级课程组名需含"四级"字样以匹配 `course-l4.json`。

## 嵌入 URL

```
/courses/ai-trainer/embed.html?auto=1&chapter=<start_chapter>
```

| 参数 | 说明 |
|:--|:--|
| `auto=1` | 自动播放模式 |
| `chapter=N` | 从第 N 章开始（0-indexed） |
| `course=<id>` | 指定课程（缺省加载默认 `course.json`） |
| `recording=1` | 录制模式（隐藏导航/控件/进度条） |

---

## 多课程管理

一个 presentation 项目可承载多门课程，通过 `course` URL 参数区分：

| 文件 | 作用 |
|:--|:--|
| `course.json` | 默认课程 |
| `course-{id}.json` | 扩展课程 |
| `src/registry/chapters.ts` | 所有课程的章节平铺注册表 |

### 新增课程 Checklist

1. 创建 `course-{id}.json`，定义各课/段/章结构
2. 在 `App.tsx` 的 `filterChapters` 中追加新课程的章节 ID 前缀过滤
3. 在 `App.tsx` 的 `jsonMap` 中追加 URL 参数 → JSON 文件映射
4. 在 DB 中创建对应课程组
5. 新课程章节按字母后缀法分配编号，避免与已有编号区间冲突
6. 在 `deploy-courses.sh` 部署脚本中确认新的 course JSON 文件被复制

---

## 语义色 Token

| 变量 | 用途 |
|:--|:--|
| `--accent` | 核心概念 / 金句 |
| `--accent-tech` | 技术元素 / 工具 |
| `--accent-good` | 正向结论 / 最佳实践 |
| `--accent-warn` | 警告 / 风险 / 红线 |

---

## 关键陷阱

| 问题 | 原因 | 修复 |
|:--|:--|:--|
| 导航菜单消失 | `course.json` JSON 损坏 | 用脚本重新生成，勿手动编辑 |
| 章节卡片跳错位置 | DB 中 `start_chapter` 填错 | 管理员后台「同步课件章节」自动更正 |
| 字幕与音频不同步 | narrations 修改后未重新合成 | `extract → synthesize → subtitle-timing` |
| 本地 nginx 看不到更新 | 课件未进入 `dist/` | 运行 `deploy-courses.sh` |
| 插入章节后播放跳课 | 章节目录编号冲突 | `ls {编号}-*/` 检查冲突；字母后缀规避 |
| `subtitle-timing.py` 超时 | 全量扫描 2000+ 段 | 加 `--chapters` 仅处理需要的章节 |
| MiniMax "No word timing" | 模型偶发不返回词级数据 | 非致命——降级 warning，退到 default 模式生成字幕 |
