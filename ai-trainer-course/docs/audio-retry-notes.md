# 1.5 点云类音频合成记录

## 问题
1.5 S1-S3 章节（98-111）部分音频先用 edge-tts 生成，后切换 MiniMax，音色不一致。
后来 `t5-quiz` → `t5-point-quiz` 重命名导致音频路径不匹配。

## 2026-05-30 MiniMax 合成结果

### 已成功合成（MiniMax音色，额度耗尽前完成）
| 目录 | mp3数量 | narrations | 状态 |
|------|---------|-------------|------|
| t5-3d-explore/ | 6 | 6 | ✓ |
| t5-fourth-dim/ | 4 | 4 | ✓ |
| t5-sparsity/ | 4 | 5 | ⚠ 缺1个（额度用尽） |

### 额度用尽，未能合成（明天继续）
| 目录 | narrations |
|------|------------|
| t5-occlusion/ | 4 |
| t5-iron-rule/ | 3 |
| t5-snow-noise/ | 4 |
| t5-clean-methods/ | 4 |
| t5-ground-seg/ | 5 |
| t5-sop-rule/ | 3 |
| t5-confidence-rule/ | 4 |
| t5-fusion-conflict/ | 4 |
| t5-lidar-occlusion/ | 4 |
| t5-fusion-sop/ | 4 |
| t5-all-recap/ | 4 |
| t5-port-assignment/ | 4 |
| t5-point-quiz/ | 4 |
| t5-farewell/ | 4 |

### 原始 MiniMax 生成的音频（正确，勿动）
这些目录的 mp3 是 MiniMax 音色，无需重新生成：
| 目录 | 生成时间 |
|------|---------|
| t5-black-truck/ | 5月29日 12:12 |
| t5-course-promise/ | 5月29日 12:12 |
| t5-not-photo/ | 5月29日 12:12 |
| t5-physics-flaw/ | 5月29日 12:12 |
| t5-what-is-pointcloud/ | 5月29日 12:12 |

## 继续合成命令（额度刷新后执行）

```bash
cd ai-trainer-course/presentation

# 删除今日部分合成的目录（只保留已成功的）
rm -rf public/audio/t5-3d-explore public/audio/t5-fourth-dim public/audio/t5-sparsity

# 用 MiniMax 重新合成
MINIMAX_API_KEY=sk-cp-tJQubX5EdhOGlAm9yfYPL4DEdmQjbSRdmEu3NUDI6M0XkAb-CZgAF_3GvGnufgga39Ho5Ba9RLCheM__TAL1fq7lfxkMeioU9ONScxe-SqNub0T2G70S1r8 \
PRESENTATION_MINIMAX_MODEL=speech-2.8-hd \
PRESENTATION_MINIMAX_VOICE=Chinese_casual_instructor_vv2 \
npm run synthesize-audio 2>&1
```

## 验证
合成完成后检查：
- 每个 t5-* 目录都有对应数量的 mp3 文件
- 无 0 字节文件
- 音色一致（翁老师声线）