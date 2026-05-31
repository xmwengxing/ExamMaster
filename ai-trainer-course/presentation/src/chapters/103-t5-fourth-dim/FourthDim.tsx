import type { ChapterStepProps } from "../../registry/types";
import "./FourthDim.css";

const EXAMPLES = [
  { icon: "🪧", label: "交通标志牌", trait: "反光涂层 · 极高反射率", color: "t5fd-bright" },
  { icon: "🚗", label: "黑色汽车", trait: "吸光漆面 · 极低反射率", color: "t5fd-dark" },
  { icon: "🛣️", label: "沥青路面", trait: "漫反射 · 低反射率", color: "t5fd-dark" },
];

export default function FourthDim({ step }: ChapterStepProps) {
  return (
    <div className="t5fd-root scene-pad">
      <div className="t5fd-layout">
        <div className="t5fd-left">
          <div className="t5fd-title">
            <span className="t5fd-main">第四维：反射率</span>
            <span className="t5fd-sub">Intensity — 区分材质的核心武器</span>
          </div>
          <div className="t5fd-examples">
            {EXAMPLES.map((e, i) => (
              <div key={e.label} className={`t5fd-ex ${i <= Math.min(step, 2) ? "t5fd-ex-on" : "t5fd-ex-off"}`}>
                <span className="t5fd-ex-icon">{e.icon}</span>
                <div className="t5fd-ex-body">
                  <span className={`t5fd-ex-label ${e.color}`}>{e.label}</span>
                  <span className="t5fd-ex-trait">{e.trait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t5fd-right">
          {step >= 2 && (
            <div className="t5fd-application">
              <span className="t5fd-app-title">数据清洗应用</span>
              <span className="t5fd-app-text">反射率阈值 → 区分雨雪噪点和真实障碍物</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5fd-next">
              <span className="t5fd-next-icon">🖱️</span>
              <span className="t5fd-next-text">准备鼠标 — 亲手操控点云场景 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
