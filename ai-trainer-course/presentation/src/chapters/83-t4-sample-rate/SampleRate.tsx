import type { ChapterStepProps } from "../../registry/types";
import "./SampleRate.css";

export default function SampleRate({ step }: ChapterStepProps) {
  return (
    <div className="t4sr-root scene-pad">
      <div className="t4sr-layout">
        <div className="t4sr-left">
          <div className="t4sr-header">
            <span className="t4sr-num">属性 01</span>
            <span className="t4sr-name">采样率</span>
            <span className="t4sr-unit">Sample Rate · 单位 Hz</span>
          </div>
          <div className="t4sr-compare">
            <div className="t4sr-card t4sr-card-phone">
              <span className="t4sr-card-label">电话录音</span>
              <span className="t4sr-card-value">8 kHz</span>
              <span className="t4sr-card-note">还原≤4kHz · 人声够用</span>
            </div>
            <div className="t4sr-card t4sr-card-hifi">
              <span className="t4sr-card-label">智能音箱</span>
              <span className="t4sr-card-value">16-48 kHz</span>
              <span className="t4sr-card-note">完整频谱 · 音乐级</span>
            </div>
          </div>
        </div>
        <div className="t4sr-right">
          {step >= 1 && (
            <div className="t4sr-wrong">
              <span className="t4sr-wrong-title">❌ 常见错误</span>
              <span className="t4sr-wrong-desc">8k→16k 强行重采样 = 拿假数据骗模型</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4sr-nyquist">
              <span className="t4sr-nyq-title">奈奎斯特定理</span>
              <span className="t4sr-nyq-text">采样率 ÷ 2 = 可还原的最高频率</span>
              <span className="t4sr-nyq-ex">8kHz → 最高还原 4kHz</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4sr-rule">
              <span className="t4sr-rule-text">第一步确认下游模型输入规格，不是先处理数据</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
