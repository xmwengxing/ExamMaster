import type { ChapterStepProps } from "../../registry/types";
import "./ReduceDim.css";

const SWORDS = [
  { name: "均匀抽帧", freq: "固定间隔 (1 FPS)", icon: "⏱" },
  { name: "关键帧提取", freq: "I帧直接导出", icon: "📦" },
  { name: "事件触发", freq: "动态启动记录", icon: "🎯" },
];

export default function ReduceDim({ step }: ChapterStepProps) {
  return (
    <div className="t3rd-root scene-pad">
      <div className="t3rd-layout">
        <div className="t3rd-left">
          <div className="t3rd-concept">
            <span className="t3rd-title">降维打击</span>
            <span className="t3rd-formula">视频 (W×H×T) → 图像集合 (W×H)</span>
            <span className="t3rd-essence">不要每一帧，要代表业务变化的瞬间</span>
          </div>
          {step >= 1 && (
            <div className="t3rd-ratio">
              <span className="t3rd-ratio-label">关键信息帧占比</span>
              <div className="t3rd-ratio-examples">
                <div className="t3rd-ratio-ex t3rd-ratio-low">
                  <span className="t3rd-ratio-scene">空走廊监控</span>
                  <span className="t3rd-ratio-pct">&lt; 0.1%</span>
                </div>
                <div className="t3rd-ratio-ex t3rd-ratio-high">
                  <span className="t3rd-ratio-scene">乒乓球慢动作</span>
                  <span className="t3rd-ratio-pct">~ 90%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="t3rd-right">
          <div className="t3rd-swords">
            {SWORDS.map((s, i) => (
              <div key={s.name} className={`t3rd-sword ${i <= Math.min(step, 2) ? "t3rd-sword-on" : "t3rd-sword-off"}`}>
                <span className="t3rd-sword-icon">{s.icon}</span>
                <div className="t3rd-sword-body">
                  <span className="t3rd-sword-name">{s.name}</span>
                  <span className="t3rd-sword-freq">{s.freq}</span>
                </div>
              </div>
            ))}
          </div>
          {step >= 3 && (
            <div className="t3rd-next">
              <span className="t3rd-next-text">第一剑：均匀抽帧 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
