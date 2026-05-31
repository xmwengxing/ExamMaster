import type { ChapterStepProps } from "../../registry/types";
import "./ThreeDMaze.css";

export default function ThreeDMaze({ step }: ChapterStepProps) {
  return (
    <div className="t4mz-root scene-pad">
      <div className="t4mz-layout">
        <div className="t4mz-left">
          <div className="t4mz-title-area">
            <span className="t4mz-main-title">语音 = 三维数据体</span>
            <span className="t4mz-sub">不是"声音"，是可量化的多维信号</span>
          </div>
          <div className="t4mz-dims">
            {[
              { icon: "📐", name: "物理维度", items: "采样率 · 声道 · 位深", show: step >= 0 },
              { icon: "⏱", name: "时序维度", items: "音素依赖 · 不可随机打乱 · 前后文标注", show: step >= 1 },
              { icon: "💬", name: "语义维度", items: "语气 · 情绪 · 意图 · 反讽", show: step >= 2 },
            ].map((d) => (
              <div key={d.name} className={`t4mz-dim ${d.show ? "t4mz-dim-on" : "t4mz-dim-off"}`}>
                <span className="t4mz-dim-icon">{d.icon}</span>
                <div className="t4mz-dim-body">
                  <span className="t4mz-dim-name">{d.name}</span>
                  <span className="t4mz-dim-items">{d.items}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t4mz-right">
          {step >= 2 && (
            <div className="t4mz-warning">
              <span className="t4mz-warn-text">不能用处理文本的思维处理语音</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4mz-first-step">
              <span className="t4mz-first-label">第一步不是打开标注工具</span>
              <span className="t4mz-first-big">先学会看懂语音</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
