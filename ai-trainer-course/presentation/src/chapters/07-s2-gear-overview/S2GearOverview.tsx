import type { ChapterStepProps } from "../../registry/types";
import "./S2GearOverview.css";

const gears = [
  { label: "需求定义", sub: "Requirement" },
  { label: "数据准备", sub: "Data Prep" },
  { label: "模型训练与评估", sub: "Model" },
  { label: "系统集成", sub: "Integration" },
  { label: "运营迭代", sub: "Iteration" },
];

export default function S2GearOverview({ step }: ChapterStepProps) {
  return (
    <div className="go-root scene-pad">
      <div className="go-center">
        <span className="go-title">全链路业务闭环</span>
        <div className="go-gear-row">
          {gears.map((g, i) => (
            <div key={g.label} className="go-gear-col">
              <div className={`go-gear-wrap ${i <= step ? "go-gear-on" : "go-gear-off"}`}>
                <svg width="140" height="140" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="currentColor" strokeWidth="14" strokeDasharray="10 12" />
                  <circle cx="90" cy="90" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
                  <circle cx="90" cy="90" r="18" fill="currentColor" opacity="0.12" />
                  <circle cx="90" cy="90" r="6" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <div className={`go-gear-label ${i <= step ? "go-label-on" : ""}`}>
                <span className="go-gear-name">{g.label}</span>
                <span className="go-gear-sub">{g.sub}</span>
              </div>
            </div>
          ))}
        </div>
        {step >= 4 && <span className="go-bottom-text">五个齿轮彼此咬合</span>}
      </div>
    </div>
  );
}
