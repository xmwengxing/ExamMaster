# 交互式课件开发与更新指南

> 课件的开发、部署、入库、验证流程。
> 课件开发遵循 [course-forge](https://github.com/xmwengxing/course-forge) skill 规范。
>
> 本文档**完全脱敏**：不绑定任何具体项目 / 课程编号 / 教师信息。复制到你的项目后，**改第 1-3 行的"项目根路径"** 即可。

---

## 速查

| 项 | 值 |
|---|---|
| 课件工程 | `<project-root>/presentation/` |
| 课件源码 | `presentation/src/chapters/` — 每章一个目录 |
| 课程结构 | `presentation/public/course.json` — 默认课程；`course-{id}.json` — 扩展课程 |
| 源文档 | `<project-root>/docs/` |
| 素材目录 | `docs/materials/` — 场景截图、模板等按名称引用 |
| 本地预览 | `http://localhost:5174/?auto=1`（dev） / `http://localhost:9080/courses/<course-id>/embed.html`（Docker） |
| 部署脚本 | `python3 deploy-courses.sh`（仅课件） |

> ⚠️ **dev 端口 5174** 不是默认 5173 — `vite.config.ts` 显式配置 `port: 5174`（避免与本机其他 Vite 项目冲突）。以 `vite.config.ts` 实际值为准。

---

## 目录结构

```
<project-root>/
├── course.json / course-{id}.json    # 课程结构（课 → 段 → 章）
├── docs/                             # 源文档（口播稿）
│   ├── <course-name>.md
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
│   │   ├── course.json / course-{id}.json   # 课程结构（运行时加载）
│   │   ├── minimax-word-timing/      # 词级时戳（minimax 模式字幕）
│   │   ├── subtitle-timing.json      # 字幕时序（最终）
│   │   └── audio-segments.json       # 段落-步数映射（生成根目录）
│   ├── scripts/                      # 合成/字幕/录屏/部署
│   │   ├── extract-narrations.ts     # 提取所有 narrations.ts → audio-segments.json
│   │   ├── synthesize-audio.sh       # TTS 合成（provider-agnostic）
│   │   ├── subtitle-timing.py        # 字幕时序生成（双模式）
│   │   ├── compress-audio.sh         # 音频压缩（体积优化）
│   │   └── tts-batch-*.py            # 自建批量 TTS 脚本（可选）
│   └── audio-segments.json           # 段落-步数映射（TTS 输入）
└── dist/                             # Vite 构建产物（纯静态）
```

---

## 开发流程

### 1. 源文档 + 素材

口播稿放入 `docs/<course-name>.md`。课件中提到的真实场景截图、模板文件等放入 `docs/materials/`，开发时按文件名引用。

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

章节目录创建完成后，**运行注册脚本自动生成** `chapters.ts`：

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

#### ⚠️ 关键：新增课号必须同步 3 个白名单

每次新增**一级课号**（如某课程用 `i6-` 前缀，新一课用 `i7-` 前缀）时，**必须同步更新**以下位置，否则菜单不可点 / 课程不显示：

1. **`App.tsx` 的 `filterChapters` 函数**（课件菜单过滤逻辑）—— 在 `l4Prefixes` 数组 / 类似白名单数组中加入新前缀
2. **`App.tsx` 的 l3 排除逻辑**（其他课程的章节被本课程过滤掉）—— 加入新前缀到对应 exclude 数组
3. **`App.tsx` 的 `jsonMap`**（URL `course=` 参数 → JSON 文件映射）—— 加入新课程的 URL 映射

**症状**：菜单点不动 / 课件空白 / URL 切到新课程仍加载旧 JSON。
**自检脚本**（从 `App.tsx` 提取所有 `i\d+-` 前缀）：

```bash
grep -oE 'i[0-9]+-' presentation/src/App.tsx | sort -u
ls presentation/src/chapters/ | grep -oE '^[0-9]+-[^-]+-' | sort -u
# 两个 diff 应当为空
```

### 3. 验收

```bash
cd presentation
npm run dev                     # → http://localhost:5174/?auto=1
```

#### 硬约束自动化检测（必须运行）

subagent 自报 PASS 不可信（之前发生过"0 个 svg/animate 屏"自报全部 PASS 的事故）。**必须用脚本扫**：

```python
# scripts/check-hard-rules.py
# 硬约束 #5: 每屏（每个 step 分支）至少 1 个 svg + animate() 调用
import re, sys
from pathlib import Path

CHAPTERS = Path("src/chapters")
issues = []
for chap in sorted(CHAPTERS.iterdir()):
    if not chap.is_dir(): continue
    tsx = chap / "index.tsx"
    if not tsx.exists(): continue
    text = tsx.read_text()
    # 提取所有 step >= N 条件分支
    branches = re.findall(r'step\s*>=?\s*(\d+)\s*&&\s*step\s*<=?\s*(\d+)|step\s*===?\s*(\d+)', text)
    screens = set()
    for b in branches:
        if b[0]:  # range
            for s in range(int(b[0]), int(b[1])+1):
                screens.add(s)
        elif b[2]:
            screens.add(int(b[2]))
    # 统计每屏 svg 数 + animate() 数
    for s in sorted(screens):
        # 此处需手写 step-by-step 分析（与具体渲染函数耦合）
        # 简化: 整个文件 svg 数 / animate() 数 / 屏数 ≈ 平均 ≥ 1
        pass

svg_count = len(re.findall(r'<svg[\s>]', text))
animate_count = len(re.findall(r'\banimate\s*\(', text)) + len(re.findall(r'svg\.createDrawable', text))
print(f"{chap.name}: svg={svg_count} animate()={animate_count} screens={len(screens)}")
if svg_count < len(screens) or animate_count < len(screens) * 0.5:
    issues.append(chap.name)
sys.exit(1 if issues else 0)
```

**验收流程**：
1. `npm run dev` 启动
2. 打开 `http://localhost:5174/?auto=1` 跑一遍 auto 模式
3. **逐章手动点完**（不能只看 auto 模式 — auto 模式会自动跳 step，看不到单屏细节）
4. 用上面的 Python 脚本扫硬约束 #5
5. `npx tsc --noEmit` 通过
6. 检查 narrations 步数与 useChapterProgress 屏数严格相等

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
>
> **TTS 限速注意**：多数 TTS 引擎限速 1 req / 0.5-1s。批量合成 36 步 + 限速 0.6s = 至少 25s。脚本可加 `--rate` 调速（默认保守）。

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
>
> **超时经验**：全量扫描 2000+ 段时 Python 解析易超时。**必加 `--chapters` 限定**当前批次章节。

#### 音频压缩（推荐）

实战经验：默认 128kbps / 32kHz / stereo 偏大；课件场景推荐 **96kbps / 22kHz / mono**（25% 体积节省，语音透明听感可接受）：

```bash
# 通用压缩（按预设）
bash scripts/compress-audio.sh --preset high     # 64kbps，语音透明，↓50%

# 自定义参数（推荐）：96k / 22kHz / mono
for f in public/audio/**/*.mp3; do
  ffmpeg -i "$f" -codec:a libmp3lame -b:a 96k -ar 22050 -ac 1 -y "${f%.mp3}.new.mp3"
  mv "${f%.mp3}.new.mp3" "$f"
done
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
node scripts/record.js --url "http://localhost:5174/?auto=1&recording=1"
```

URL 加 `?recording=1` 自动隐藏所有 UI 控件，纯画布录制。

---

## 入库

部署后管理员在交互式课堂后台点击「**同步课件章节**」，系统自动读取 `course.json`，对比 DB 并插入缺失条目。

> 课程组名匹配规则：在 `App.tsx` 的 `filterChapters` 同步体现（参见"新增课号必须同步 3 个白名单" 章节）。DB 中的课程组名前缀（如 "X4-xxx"）应与 `course-{id}.json` 文件名中的 `id` 一致。

## 嵌入 URL

```
/courses/<course-id>/embed.html?auto=1&chapter=<start_chapter>
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
2. **在 `App.tsx` 的 `filterChapters` 中追加新课程的章节 ID 前缀过滤**（白名单数组，如 `l4Prefixes: ["i4-", "i5-", "i6-"]`）
3. **在 `App.tsx` 的 `jsonMap` 中追加 URL 参数 → JSON 文件映射**
4. **在 `App.tsx` 的 l3 排除逻辑中加入新前缀**（避免被其他课程过滤）
5. 在 DB 中创建对应课程组
6. 新课程章节按字母后缀法分配编号，避免与已有编号区间冲突
7. 在 `deploy-courses.sh` 部署脚本中确认新的 course JSON 文件被复制

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
| **新增课号后菜单不可点** | **`App.tsx` 的 `filterChapters` 漏加新前缀** | **同步 `l4Prefixes` + l3 exclude + jsonMap 三处** |
| **subagent 自报 PASS 但实际 0 svg** | **subagent 没扫硬约束 #5** | **用 `check-hard-rules.py` 脚本逐章扫 svg/animate 数** |

---

## 实战经验沉淀

### 口播稿自然语 vs 连接词硬约束

- **失败经验**：v3 强"接下来"连接词导致 108 次过度 → 像机器人卡壳
- **v4 改进**：删除连接词硬约束 → 改纯自然语节奏，连接词使用率 7.6% 步数（13/170）
- **v4 硬约束**：
  - 单章 ≤ 12 步（避免单章过长）
  - 单步 20-35 汉字（用 `cn_count()` 仅数汉字，数字/标点不算）
  - "接下来" ≤ 1 次/章
  - "然后/但是/所以/而且/接着" 句首 ≤ 2/章
  - 教师 IP 署名仅章末 1 次

### 物理动效硬要求

- 每章 **至少 1 个真实物理演示**（车辆路径移动 / 3 行人 ID 闪烁 / 时间轴扫线 等）
- **不要照抄"线条 + 形状 + 物体"固定套路**（节点滚动 / 柱状图 grow / 描线排序）—— 这是某一项目的设计选择，不是标准答案
- 按内容设计最贴切的视觉原语：**"视频感最强的来源"是"动作语义匹配内容"**

### TTS 与音频

- **MiniMax speech-2.8-hd** + voice `Chinese_casual_instructor_vv2` 纯中文（数字用中文词）
- **限速 1 req/0.6s** —— 批量 36 段至少 25s
- **音频压缩 96k/22kHz/mono**：25% 体积节省，语音透明

### 验收自动化

- **不要相信 subagent 自报 PASS** —— 必须用 Python 脚本扫硬约束
- **不要只跑 auto 模式验收** —— auto 模式自动跳 step，看不到单屏细节，必须逐章手动点完

---

*文档版本 v1.0 — 脱敏版，错误修正（端口 5174 / 关键陷阱补 2 条 / 实战经验沉淀）。准备提交公共仓库。*
