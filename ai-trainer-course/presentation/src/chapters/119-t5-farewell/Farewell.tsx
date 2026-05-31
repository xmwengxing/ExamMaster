import type { ChapterStepProps } from "../../registry/types";
import "./Farewell.css";

export default function Farewell({ step }: ChapterStepProps) {
  return (
    <div className="t5n-root scene-pad">
      <div className="t5n-layout">
        <div className="t5n-hero">
          {step >= 1 && (
            <div className="t5n-cta">
              <span className="t5n-cta-emoji">📚</span>
              <div className="t5n-cta-text">
                <span className="t5n-cta-title">下节课预告</span>
                <span className="t5n-cta-desc">业务流程构建及业务优化通用方法</span>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="t5n-divider">
              <span>跳出单一数据视角 · 站在业务架构师维度</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5n-modules">
              <span className="t5n-modules-title">我们一起通关的四大模态</span>
              <div className="t5n-module-list">
                <span className="t5n-module-tag">📝 文本</span>
                <span className="t5n-module-tag">🎬 视频</span>
                <span className="t5n-module-tag">🎙️ 语音</span>
                <span className="t5n-module-tag">📡 点云</span>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="t5n-farewell">
              <span className="t5n-farewell-text">我是翁老师，感谢您的专注聆听，我们下节课不见不散！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}