# 人工智能训练师三级课件 — Web Video Presentation

## 项目结构

```
ai-trainer-course/
├── docs/                              # 23 篇原始口播稿 md 文档
├── course.json                        # 课程结构定义（4 个 section × 5 段）
├── regenerate-course-json.py          # course.json 维护脚本
└── presentation/                      # Vite + React + TS 项目
    ├── src/
    │   ├── chapters/                  # 97 章（01~97）
    │   ├── registry/chapters.ts       # 章节注册（97 条目）
    │   ├── components/
    │   │   ├── Subtitle.tsx/ChapterMenu.tsx/Stage.tsx...
    │   ├── hooks/
    │   │   ├── useStepper.ts/useAudioPlayer.ts/useAutoMode.ts...
    │   └── styles/
    │       ├── tokens.css/base.css/fonts.css...
    ├── public/
    │   ├── audio/                     # 合成音频（447 段 mp3）
    │   ├── course.json                # 与根目录 course.json 同步
    │   └── subtitle-timing.json       # 字幕时序配置
    ├── scripts/
    │   ├── extract-narrations.ts      # 抽出所有 narrations → JSON
    │   ├── synthesize-audio.sh        # TTS 合成 runner
    │   └── tts-providers/
    └── package.json

---

## 环境要求

| 工具 | 最低版本 | 检查命令 |
|------|---------|---------|
| Node.js | >= 18 | `node -v` |
| npm | >= 9 | `npm -v` |
| Python3 | >= 3.8 | `python3 --version`（仅 TTS 合成需要） |

---

## 快速启动

```bash
# 1. 进入项目目录
cd 人工智能训练师三级课件/presentation

# 2. 安装依赖（仅首次）
npm install

# 3. 启动开发服务器
npx vite --host 0.0.0.0 --port 5173
```

启动后浏览器打开 `http://localhost:5173/`

---

## 操作方式

| 操作 | 键盘 | 说明 |
|------|------|------|
| 前进一步 | `→` 或 点击舞台 | 切换到下一个 step |
| 后退一步 | `←` 或 `Backspace` | 回到上一个 step |
| 跳到章节开头 | 数字键 `1`~`9` | 快速跳转章节 |
| 跳到开头/结尾 | `Home` / `End` | 第一/最后一个 step |
| 切换播放模式 | 鼠标移到右上角 | Manual / Audio / Auto |
| 查看进度条 | 鼠标移到底部边缘 | 可点击跳转任意 step |

---

## 播放模式

URL 参数控制：

| URL | 模式 | 说明 |
|------|------|------|
| `http://localhost:5173/` | 手动 | 点击/方向键推进，字幕自动轮播 |
| `http://localhost:5173/?audio=1` | 半自动 | 音频跟 step 切，手动推进 |
| `http://localhost:5173/?auto=1` | 全自动 | 按一次 SPACE → 音频+字幕+画面全自动播完 |

**全自动录屏流程：**
1. 浏览器打开 `http://localhost:5173/?auto=1`
2. 按一次 `SPACE` 启动
3. 整片自动播完
4. 用录屏工具裁剪头尾即成片

---

## 字幕时序微调

文件：`presentation/public/subtitle-timing.json`

```json
"opening": {
  "0": [
    { "text": "屏幕前的各位同仁...", "ms": 10243 },
    { "text": "我会陪伴大家...", "ms": 5798 }
  ]
}
```

- `ms` 是该 chunk 的停留时长（毫秒）
- 同一 step 内各 chunk 的 `ms` 总和不变（此消彼长）
- 编辑后**刷新浏览器**即可生效

---

## 合成音频

### 方法 1：MiniMax（付费，中文最优）

```bash
export MINIMAX_API_KEY="sk-cp-sax-xxxxx"
PRESENTATION_TTS=minimax npm run synthesize-audio
```

- 模型：`speech-2.8-hd`
- 语音：`Chinese_casual_instructor_vv2`（男声讲师风格）
- 覆盖键：`PRESENTATION_MINIMAX_VOICE`、`PRESENTATION_MINIMAX_MODEL`

### 方法 2：Edge-TTS（免费）

```bash
# 首次安装
pip3 install edge-tts --break-system-packages

# 合成
PRESENTATION_TTS=edge npm run synthesize-audio
```

### 方法 3：OpenAI TTS

```bash
export OPENAI_API_KEY="sk-xxxxx"
PRESENTATION_TTS=openai npm run synthesize-audio
```

### 合成后的步骤

```bash
# 抽出 narrations → audio-segments.json（必须）
npm run extract-narrations

# 更新字幕时序配置（按新音频时长重算 ms）
# 运行项目根目录下的时序生成脚本（见下方「更新字幕时序」）
```

### 只合成部分章节

```bash
# 删除目标章节的音频目录，再合成（跳过已存在的）
rm -rf public/audio/s5-recap
PRESENTATION_TTS=minimax npm run synthesize-audio
```

---

## 更新字幕时序

每次重新合成音频后，需要重算字幕时序。切分规则：每块 ≤60 字，按字数量占比分配 ms，课堂语速约 300ms/字。

```bash
cd presentation
python3 -c "
import json

with open('audio-segments.json') as f: segs = json.load(f)
with open('public/subtitle-timing.json') as f: timing = json.load(f)

def split_text(text, max_chars=60):
    chunks, remaining = [], text
    while remaining:
        if len(remaining) <= max_chars: chunks.append(remaining); break
        cut = max_chars
        for sep in ['。','！','？']:
            pos = remaining.rfind(sep, 0, max_chars)
            if pos > max_chars // 2: cut = pos + 1; break
        else:
            for sep in ['，','；','：']:
                pos = remaining.rfind(sep, 0, max_chars)
                if pos > max_chars // 3: cut = pos + 1; break
        chunks.append(remaining[:cut]); remaining = remaining[cut:]
    return chunks

for ch in list(timing.keys()):
    timing[ch] = {}
    for s in segs:
        if s['chapter'] == ch:
            step0 = str(s['step'] - 1)
            chunks = split_text(s['text'])
            t = max(4000, int(len(s['text']) * 300))
            tc = sum(len(c) for c in chunks)
            timing[ch][step0] = [{'text': c, 'ms': max(2500, int(t * len(c) / tc))} for c in chunks]

with open('public/subtitle-timing.json', 'w') as f:
    json.dump(timing, f, ensure_ascii=False, indent=2)
print(f'Done: {len(timing)} chapters')
"
```

---

## 更换主题

```bash
# 列出可用主题
bash ../../.agents/skills/web-video-presentation/scripts/scaffold.sh --list-themes

# 切换主题（覆盖 tokens.css）
cp ../../.agents/skills/web-video-presentation/themes/<theme-id>/tokens.css src/styles/tokens.css
```

---

## 添加新课章节（标准流程）

```bash
# 1. 创建章节目录和文件
mkdir -p src/chapters/NN-<chapter-id>/
# 创建 narrations.ts、<Component>.tsx、<Component>.css

# 2. 在 src/registry/chapters.ts 中注册（import + CHAPTERS 数组）

# 3. 更新 course.json
#    编辑 ai-trainer-course/course.json，在对应 section 的 segments 中添加章节条目。
#    ⚠️ 不要用文本编辑器的查找替换追加 JSON，容易损坏括号嵌套！
#    推荐：编辑根目录的 course.json 后运行修复脚本：
python3 ../regenerate-course-json.py

# 4. Bump STORAGE_KEY（如果章节结构变更）
#    编辑 src/hooks/useStepper.ts: STORAGE_KEY = "presentation-v5"

# 5. 构建 + 抽出音频段 + 合成 + 字幕
npm run build
source .env && npm run extract-narrations
MINIMAX_API_KEY=$MINIMAX_API_KEY npm run synthesize-audio
# 运行上方「更新字幕时序」的 Python 脚本

# 6. 部署
npm run build
cp -r dist/* ../../public/courses/ai-trainer/
cd ../.. && npm run build && python3 deploy-courses.sh
```

## course.json 维护

**不要直接编辑 `presentation/public/course.json`**——它会在每次 `npm run build` 时被覆盖。

维护方式：
1. 编辑根目录 `ai-trainer-course/course.json`（添加新 section/segment/chapter）
2. 运行 `python3 regenerate-course-json.py` 验证格式 + 同步到 `presentation/public/`

```bash
cd ../  # 回到 ai-trainer-course/
python3 regenerate-course-json.py
# 输出: ✓ 重写完成: 4 sections, 97 chapters
```

此脚本的职责：验证 JSON 合法性 → 统一格式化 → 同步到 presentation/public/。

---

## 故障排查

| 问题 | 解决 |
|------|------|
| 页面白屏 | 检查 `npx tsc --noEmit` 是否通过；检查浏览器控制台报错 |
| 音频不播放 | 确认 `public/audio/<章节id>/<N>.mp3` 文件存在；用 `?auto=1` 测试 |
| 字幕不出现 | 检查 `public/subtitle-timing.json` 格式是否合法 JSON |
| **左侧导航菜单消失** | `course.json` JSON 格式损坏 → `python3 ../regenerate-course-json.py` |
| Vite 端口被占用 | 换端口：`npx vite --port 5174` |
| MiniMax 合成失败 | 检查 .env 中 MINIMAX_API_KEY；确认后台 Token Plan 额度 |
