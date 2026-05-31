import type { ChapterStepProps } from "../../registry/types";
import "./VadIntro.css";

export default function VadIntro({ step }: ChapterStepProps) {
  return (
    <div className="t4vi-root scene-pad">
      <div className="t4vi-layout">
        <div className="t4vi-left">
          <div className="t4vi-title">
            <span className="t4vi-main">VAD 静音检测</span>
            <span className="t4vi-sub">Voice Activity Detection</span>
          </div>
          <div className="t4vi-demo">
            <div className="t4vi-wave-seg">
              <svg width="100%" height="50" viewBox="0 0 500 50"><rect x="0" y="15" width="60" height="20" rx="3" fill="var(--accent)" opacity=".3"/><rect x="65" y="5" width="160" height="40" rx="3" fill="var(--accent)" opacity=".8"/><rect x="230" y="15" width="50" height="20" rx="3" fill="var(--accent)" opacity=".3"/><rect x="285" y="5" width="140" height="40" rx="3" fill="var(--accent)" opacity=".8"/><rect x="430" y="15" width="60" height="20" rx="3" fill="var(--accent)" opacity=".3"/></svg>
              <div className="t4vi-timeline">
                <span className="t4vi-timeline-tag">静音</span>
                <span className="t4vi-timeline-tag t4vi-timeline-tag-speech">语音</span>
                <span className="t4vi-timeline-tag">静音</span>
                <span className="t4vi-timeline-tag t4vi-timeline-tag-speech">语音</span>
                <span className="t4vi-timeline-tag">静音</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t4vi-right">
          {step >= 1 && (
            <div className="t4vi-tool">
              <span className="t4vi-tool-title">工具：WebRTC VAD</span>
              <span className="t4vi-tool-item">Google 开源 · 轻量级 · 实时处理</span>
              <span className="t4vi-tool-item">Python: webrtcvad 库</span>
              <span className="t4vi-tool-item">敏感度 2-3 覆盖多数场景</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4vi-stats">
              <span className="t4vi-stats-text">10分钟录音 → ~6分钟有效语音</span>
              <span className="t4vi-stats-note">切除4分钟静音 · 标注效率提升40%</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4vi-next">
              <span className="t4vi-next-text">切片：怎么切才不伤语义？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
