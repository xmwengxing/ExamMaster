# `ai-trainer-course/` —— 课件开发工作目录

> **此目录是占位**。课件源码、源文档、构建产物均**不入版本控制**（属于用户数据产物，体积大、版本耦合到课件内容）。
>
> 课件作者请按 `docs/COURSE-UPDATE-GUIDE.md` 工作流，把课件工程放在本目录之外（推荐：`~/.cache/ai-trainer-course/` 或工作区外的独立路径），构建产物按 Step 5 工作流部署到 `dist/courses/ai-trainer/` 和远端服务器。

## 为什么不在仓库里

- 课件源含数十分钟到数小时 TTS 音频（MB 到 GB 级别）
- 课件源含完整 `node_modules/`（数百 MB）
- 课件内容随业务持续更新（常态化业务，频繁 commit 会污染 git 历史）
- 课件内容是具体业务数据，不应混入"系统功能代码"仓库

## 课件作者用哪份代码

请使用 [course-forge](https://github.com/xmwengxing/course-forge) 仓库提供的模板/组件/TTS 工具链开发新课件。
