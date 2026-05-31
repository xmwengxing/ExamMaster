import type { ChapterStepProps } from "../../registry/types";
import "./Next.css";

export default function Next({ step }: ChapterStepProps) {
  return (
    <div className="t2nx-root scene-pad">
      <div className="t2nx-layout">
        <div className="t2nx-left">
          <div className="t2nx-preview">
            <span className="t2nx-preview-label">下节课预告</span>
            <div className="t2nx-next-course">
              <span className="t2nx-next-name">视频类业务数据处理</span>
              <span className="t2nx-next-tag">Section 1.3</span>
            </div>
            <div className="t2nx-topics">
              <span className="t2nx-topic">🎬 关键帧提取</span>
              <span className="t2nx-topic">🎯 目标检测结构化</span>
              <span className="t2nx-topic">⏱ 时间维度标注指南</span>
            </div>
          </div>
        </div>
        <div className="t2nx-right">
          {step >= 0 && (
            <div className="t2nx-method">
              <span className="t2nx-method-text">数据模态虽变</span>
              <span className="t2nx-method-rule">合规优先 · 规则为本 — 完全相通</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t2nx-farewell">
              <span className="t2nx-farewell-name">翁老师</span>
              <span className="t2nx-farewell-text">感谢全程专注听完今天的课程</span>
              <span className="t2nx-farewell-cta">期待看到你的SOP作业 · 下节课见</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
