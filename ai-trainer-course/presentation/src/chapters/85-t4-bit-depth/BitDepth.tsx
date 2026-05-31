import type { ChapterStepProps } from "../../registry/types";
import "./BitDepth.css";

export default function BitDepth({ step }: ChapterStepProps) {
  return (
    <div className="t4bd-root scene-pad">
      <div className="t4bd-layout">
        <div className="t4bd-left">
          <div className="t4bd-header">
            <span className="t4bd-num">属性 03</span>
            <span className="t4bd-name">位深</span>
            <span className="t4bd-unit">Bit Depth · 通常 16bit</span>
          </div>
          <div className="t4bd-range">
            <span className="t4bd-range-title">动态范围</span>
            <div className="t4bd-range-bar">
              <span className="t4bd-range-label">🪡 针落地</span>
              <div className="t4bd-range-track">
                <div className="t4bd-range-fill" style={{width:'100%'}}/>
                <span className="t4bd-range-val">96 dB</span>
              </div>
              <span className="t4bd-range-label">✈️ 喷气机</span>
            </div>
          </div>
        </div>
        <div className="t4bd-right">
          {step >= 0 && (
            <div className="t4bd-summary">
              <span className="t4bd-sum-title">三大属性速查</span>
              <span className="t4bd-sum-item">📡 采样率 → 频率分辨率</span>
              <span className="t4bd-sum-item">🎧 声道 → 空间组织方式</span>
              <span className="t4bd-sum-item">📊 位深 → 动态精度</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4bd-next">
              <span className="t4bd-next-text">S3：VAD切片与重叠音 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
