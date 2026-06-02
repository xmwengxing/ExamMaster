# 交互式课件更新指南

> ExamMaster 课件的常态化开发 / 部署 / 入库 / 验证流程。
> **AI/开发者必读** —— 课件是持续维护的常态业务，不是"做完一次"。

---

## 课件制作工具链

课件从源文档到可发布的 Web 课件，整套模板、组件、TTS 合成、字幕生成、3D 探索等工具沉淀在独立的 skill 仓库：

**🔗 [course-forge](https://github.com/xmwengxing/course-forge)**

克隆到本地后作为 AI 助手的 skill 加载（`~/.agents/skills/course-forge/SKILL.md`），用于：
- 源文档分段拆分（S1-S5 / 每段 3-8 章）
- React + Vite + TS 课件项目脚手架
- 5 个沉淀组件：`AnimatedNumber` / `BpmnFlow` / `FlippableCard` / `StaggeredAppear` / `TabSwitcher`
- TTS 合成（provider-agnostic：MiniMax / OpenAI / edge-tts / 内置）
- 字幕时序生成 + 章节时长统计
- 画面-口播对位 5 维自检清单

---

## 0. 速查

| 项 | 值 |
|---|---|
| 课件工程位置 | **仓库外**（推荐 `~/.cache/<course>/` 或工作区外路径）—— 课件源**不入版本控制**（见 `ai-trainer-course/README.md`）|
| 课件工程内部 | `<course>/docs/` 源文档 · `<course>/presentation/` 源码 · `<course>/presentation/dist/` 构建产物 |
| 本地 dev 静态（nginx 服务） | `dist/courses/<course>/` |
| 本地 vite dev 静态 | `public/courses/<course>/` |
| 远端服务器静态 | `<server>:<project>/dist/courses/<course>/` |
| 部署脚本 | `deploy-courses.sh`（仓库内）|
| 章节入库 SQL 模板 | `scripts/import-course-chapter.template.sql`（复制后改 X.X）|
| 学员端入口 | `pages/Student/InteractiveCourseViewer.tsx` |
| 管理端入口 | `pages/Admin/InteractiveCourseManager.tsx` |
| 后端 service | `src/services/interactive-courses.service.js` |
| 后端 controller | `src/controllers/interactive-courses.controller.js` |
| 后端路由 | `src/routes/interactive-courses.routes.js` |
| 完整工作流 skill | [course-forge](https://github.com/xmwengxing/course-forge) 仓库 |

---

## 1. 完整流程（7 步）

### Step 1：源文档（Markdown）
位置：`<course>/docs/<X.X 标题>.md`（在仓库外的课件工程内）

命名约定：
- `1.1业务流程设计.md`
- `1.6业务流程构建及业务优化通用方法.md`
- `1.7简单场景业务流程分析与优化.md`
- `2.1数据处理规范制定基础.md`

### Step 2：课件开发（React + Vite + TypeScript）
位置：`<course>/presentation/`

使用 **course-forge skill** 生成：
- `src/chapters/<chapter>.tsx` —— 每章一个文件
- `src/chapters.ts` —— 注册章节
- `src/course.json` —— sections 树状结构（用 `regenerate-course-json.py` 重新格式化）
- `audio/<chapter>/*.mp3` —— TTS 合成音频
- 音频优先用 **MiniMax speech-2.8-hd** + `Chinese_casual_instructor_vv2` 音色

### Step 3：验收
- **时长统计**：`python3 scripts/chapter-stats.py`（总时长、纯朗读、视频预估）
- **画面-口播对位 5 维自检**：数字 / 专名 / 形状 / 对比 / 时序
- **5 类动态来源硬性规则**：数字滚动 / 序列入场 / 微动效 / 互动组件 / 路径绘制
- **浏览器回放**：空格启动 Auto 模式，鼠标点击翻页

### Step 4：构建
```bash
cd <course>/presentation
npm run build
# 产物: presentation/dist/ (含 courses/<course>/ 目录)
```

### Step 5：部署（`deploy-courses.sh` 一键完成 4 步）
```bash
# 默认 COURSE_NAME = ai-trainer，路径硬编码在脚本顶部可改
python3 deploy-courses.sh --course <course-name>
# [1/4] 构建课件
# [2/4] 复制到本地 public/courses/ (vite dev 读)
# [2.5/4] 同步到本地 dist/courses/ (docker nginx :ro 挂载)
# [3/4] 上传到服务器 dist/courses/
```

⚠️ **服务器 SSH 密码**：默认 `***REDACTED***`，可用 `SSH_PASSWORD=...` 环境变量覆盖。

### Step 6：DB 入库（每章一次 SQL）
**模板**：`scripts/import-course-chapter.template.sql`

```bash
# 1. 复制模板
cp scripts/import-course-chapter.template.sql scripts/import-<X.X>-chapters.sql

# 2. 修改模板中的 X.X / start_chapter / sort_order / group_id / description

# 3. 执行
PGPASSWORD=<密码> docker exec -i examaster_postgres psql -U edumaster_user -d edumaster \
  < scripts/import-<X.X>-chapters.sql
```

⚠️ **start_chapter 计算方法**：
```bash
node -e "
const c = JSON.parse(require('fs').readFileSync('<course>/presentation/dist/course.json'));
let i = 0;
for (const sec of c.sections) {
  for (const seg of (sec.segments || [])) {
    for (const ch of (seg.chapters || [])) {
      if (sec.id === '1.6' && ch.id === ch.id) { console.log('1.6 起始:', i); break; }
      i++;
    }
  }
}
"
```

### Step 7：验证（5 步）
```bash
# 1. DB 数据
PGPASSWORD=<密码> docker exec -i examaster_postgres psql -U edumaster_user -d edumaster \
  -c "SELECT id, title, sort_order, start_chapter, status FROM interactive_courses ORDER BY sort_order;"

# 2. 本地 dist 与 public 一致
diff -rq public/courses/<course> dist/courses/<course>

# 3. 远端服务器 dist 是最新版
SSH_ASKPASS=/tmp/_ssh_pass.py SSH_ASKPASS_REQUIRE=force ssh root@47.104.173.139 \
  'grep -c <X.X-section-id> <server>/dist/courses/<course>/course.json'

# 4. 重启 docker nginx 让本地 dist 生效
docker restart examaster_nginx
# 验证: docker exec examaster_nginx ls /usr/share/nginx/html/courses/<course>/audio/ | wc -l

# 5. 学员端 API 返回 published 章节
curl -s -H "Cookie: <学员token>" http://localhost:3080/api/interactive-courses/public \
  | jq '.groups[].chapters[].id'
```

嵌入 URL 模板：
```
https://<域名>/courses/<course>/embed.html?auto=1&chapter=<start_chapter>
```

---

## 2. 关键概念

### `start_chapter`（核心字段）
- **定义**：该章节在课件 `course.json` 内的 **0-indexed 章节序号**
- **作用**：学员点击"开始学习"时跳到 `?chapter=<start_chapter>`
- **当前已设置值**：
  | 章节 | start_chapter | 含义 |
  |---|---|---|
  | 1.1 | 0 | t1.1.x 第 0 章 |
  | 1.2 | 30 | t1.2.x 第 30 章（1.1 累计 30 章）|
  | 1.3 | 55 | 累计 55 章 |
  | 1.4 | 77 | 累计 77 章 |
  | 1.5 | 97 | 累计 97 章 |
  | 1.6 | 119 | 累计 119 章（+24）|
  | 1.7 | 143 | 累计 143 章（占位）|
  | 1.8 | 167 | 累计 167 章（占位）|

### 命名约定
- **章节 id**：`ic-trainer-<X.X>` （`interactive_courses` 表主键）
- **课程组 id**：`icg-<timestamp>`（自动生成，1.6/1.7/1.8 沿用现有 `icg-ai-trainer-3`）
- **课件内章节 id**：`t<section>-<slug>` （如 `t6-bill-gate`）

### 课程组与章节
- 1 个 `interactive_course_groups` 记录 = 1 套课程
- 1 个 `interactive_courses` 记录 = 1 个章节（如"1.1 通用业务流程和业务数据"）
- 学员端按"组 → 章节"两级渲染（`pages/Student/InteractiveCourseViewer.tsx`）
- **状态过滤**：`status='published'` 才在学员端显示

---

## 3. 关键陷阱（必读）

### 陷阱 1：`start_chapter` service bug（**已修 2026-06-02**）
- **症状**：管理员在 InteractiveCourseManager 表单填 `start_chapter=119`，但 DB 写入 0
- **根因**：`src/services/interactive-courses.service.js` 的 `createChapter` / `updateChapter` SQL 漏写 `start_chapter` 列
- **修法**：PR 已合入，SQL 增加 `start_chapter=$9` + params 同步
- **检查**：commit hash / diff 关键词 `start_chapter` 即可定位

### 陷阱 2：本地 dist 不同步（**已修 2026-06-02**）
- **症状**：本地 docker nginx 学员看到旧版（1.5），但服务器已是新版（1.6）
- **根因**：`deploy-courses.sh` 同步到 `public/courses/` + 远端 dist，**未同步本地 `dist/courses/`**；而 `docker-compose.yml` 把 `./dist` 挂到 nginx 容器
- **修法**：deploy 脚本新增 `[2.5/4] 同步到本地 dist/courses/`
- **副作用**：deploy 完成后**必须** `docker restart examaster_nginx` 让容器重新读 dist

### 陷阱 3：服务器 SSH 密码过期
- **症状**：`rsync` 失败，deploy 中断
- **修法**：用 `SSH_PASSWORD=新密码 python3 deploy-courses.sh` 覆盖默认值
- **默认值**：`***REDACTED***`（deploy-courses.sh line 19）

### 陷阱 4：嵌入 URL 起始章节错位
- **症状**：点击 1.5 跳到第 1 章（不是 1.5 首章）
- **根因**：`start_chapter=0`（admin 漏填或 service bug）
- **修法**：见陷阱 1 + 用 SQL 直接 `UPDATE` 修正

### 陷阱 5：占位章节混淆学员
- **症状**：1.7/1.8 占位后学员看到空白卡
- **根因**：`status='published'` 而课件未构建
- **修法**：占位章节必须用 `status='draft'`，学员端 `/api/interactive-courses/public` 只返回 published

### 陷阱 6：AI 训练师三级组 id 是历史值
- **症状**：新增课程组时 `group_id` 用错
- **根因**：`icg-ai-trainer-3` 是数据库中现有组的实际 id，不一定符合 `icg-${Date.now()}` 模板
- **修法**：先 `SELECT id, title FROM interactive_course_groups` 确认再插入

### 陷阱 7：course.json 的 `id` 与 DB 章节 `id` 不是一回事
- `course.json` 的 `sections[].id` = 业务章节号（"1.6"）
- DB `interactive_courses.id` = 内部主键（"ic-trainer-1.6"）
- 两者通过 `sort_order` 排序关联，不要混用

---

## 4. SQL 模板（每章复制）

```sql
-- X.X 章节
INSERT INTO interactive_courses
  (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter)
VALUES (
  'ic-trainer-X.X',                  -- 改 X.X
  '<section.title>',                 -- 改
  '人工智能训练师三级 · X.X <标题> — N分钟交互式课件，<涵盖>。',  -- 改
  'courses/ai-trainer/',             -- 一般不动
  '',
  'published',
  <sort_order>,                      -- 改
  'icg-ai-trainer-3',                -- 一般不动
  <start_chapter>                    -- 改（用 node 脚本算）
) ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  base_path     = EXCLUDED.base_path,
  status        = 'published',
  sort_order    = EXCLUDED.sort_order,
  group_id      = EXCLUDED.group_id,
  start_chapter = EXCLUDED.start_chapter,
  updated_at    = NOW();

-- 验证
SELECT id, title, sort_order, start_chapter, status FROM interactive_courses ORDER BY sort_order;
```

---

## 5. 日常维护建议

### 5.1 课件开发
1. **每一章开发前先看 1.6 已沉淀的 5 个组件**（`templates/scripts/` 或 `presentation/src/components/`）：
   - `AnimatedNumber` / `BpmnFlow` / `FlippableCard` / `StaggeredAppear` / `TabSwitcher`
2. **新增组件要纳入 `presentation/src/components/`**，并写最少 1 个使用示例
3. **TTS 优先级**：MiniMax → OpenAI → edge-tts → 自带 TTS（限流时降级）
4. **避免纯黄色**：配色按语义（红/绿/蓝/紫）分散视觉疲劳
5. **字号按信息密度自适应**，不统一放大
6. **边框用实线不用虚线**
7. **5 主题色 token**（`token.css`）：`--bad` 红 / `--good` 绿 / `--info` 蓝 / `--flow` 紫 / `--ease-soft-out` 柔和

### 5.2 课程开发
1. **新章节入 DB 前**先确认源文档已在 `ai-trainer-course/docs/`
2. **管理端 InteractiveCourseManager 维护**优于直接 SQL（可审计）
3. **每章发布前必跑 5 步验证**（见 §1 Step 7）
4. **保留旧章节 `status='draft'` 而不是删除**（历史练习进度可恢复）
5. **课程组排序**靠 `sort_order`，不要靠 `created_at`（学员端按 `sort_order ASC` 渲染）

### 5.3 部署
1. **每次课件改完跑一次 `deploy-courses.sh`**
2. **deploy 完成后 `docker restart examaster_nginx`**（本地 dist 同步后必须）
3. **服务器同步**靠 SSH，密码失效时改 `SSH_PASSWORD` 环境变量
4. **生产环境有 bug 时**先看 nginx error log：`docker logs examaster_nginx`
5. **新课件**需要复制 `ai-trainer-course` 整个目录并改 `COURSE_NAME`

### 5.4 学员端常见问题
| 现象 | 排查 |
|---|---|
| 学员看不到新章节 | DB `status='published'`？`/api/interactive-courses/public` 拉到了吗？|
| 跳到错误章节 | `start_chapter` 是否对？用 SQL `SELECT` 确认 |
| 音频不播放 | nginx 容器 `/usr/share/nginx/html/courses/<course>/audio/` 存在？|
| 嵌入页 404 | `base_path` 是否对？`courses/ai-trainer/` 与 nginx 实际目录一致？|
| 历史进度丢失 | 学员 sessionStorage 不持久化，刷新正常会清空 |

### 5.5 给 AI 助手的指示
- 任何"更新课件"任务，**先看本指南**再动手
- 任何"加新章节"任务，**先算 start_chapter**（用 node 脚本）
- 任何"修 service"任务，**检查 start_chapter 字段是否在 SQL 中**（陷阱 1）
- 任何"deploy"任务，**记得 docker restart examaster_nginx**（陷阱 2）

---

## 6. 故障排查清单

```bash
# 1. DB 中章节数
PGPASSWORD=... docker exec -i examaster_postgres psql -U edumaster_user -d edumaster \
  -c "SELECT COUNT(*) FROM interactive_courses WHERE status='published';"

# 2. 学员端 API 拉到的章节
curl -s http://localhost:3080/api/interactive-courses/public \
  -H "Cookie: <token>" | jq '.groups[].chapters | length'

# 3. nginx 实际服务的 audio
docker exec examaster_nginx ls /usr/share/nginx/html/courses/ai-trainer/audio/ | head

# 4. 嵌入页是否 200
docker exec examaster_nginx curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost/courses/ai-trainer/embed.html

# 5. 服务器 dist 是否最新
SSH_ASKPASS=/tmp/_ssh_pass.py SSH_ASKPASS_REQUIRE=force \
  ssh root@47.104.173.139 \
  'ls -la /www/wwwroot/exammaster.zzzjl.com/dist/courses/ai-trainer/course.json'

# 6. 数据库密码
PGPASSWORD 变量在 docker-compose.yml + .env
```

---

## 7. 链接

- [README.md](../README.md) / [README_CN.md](../README_CN.md) — 项目总览
- [AGENTS.md](../AGENTS.md) — AI 助手指令（包含本指南的简化版）
- [course-forge skill](file:///home/shijingtian/.agents/skills/course-forge/SKILL.md) — 课件开发工作流
- [postgres/migrations](../postgres/migrations/) — DB 迁移历史
