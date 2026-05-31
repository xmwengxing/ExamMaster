import type { ChapterStepProps } from "../../registry/types";
import "./Garbage.css";

const SWORDS_SUMMARY = [
  { name: "均匀抽帧", when: "运动均匀·变化平缓", key: "关键帧占比 5-20%", icon: "⏱" },
  { name: "I帧提取", when: "宏观统计·不要求时间精度", key: "每2~5秒/帧", icon: "📦" },
  { name: "事件触发", when: "大部分时间静止·关键事件稀少", key: "关键帧占比 <5%", icon: "🎯" },
];

export default function Garbage({ step }: ChapterStepProps) {
  return (
    <div className="t3gb-root scene-pad">
      <div className="t3gb-layout">
        <div className="t3gb-left">
          <span className="t3gb-title">三剑客速查表</span>
          <div className="t3gb-table">
            {SWORDS_SUMMARY.map((s, i) => (
              <div key={s.name} className={`t3gb-row ${i <= Math.min(step, 2) ? "t3gb-row-on" : "t3gb-row-off"}`}>
                <span className="t3gb-row-icon">{s.icon}</span>
                <div className="t3gb-row-body">
                  <span className="t3gb-row-name">{s.name}</span>
                  <span className="t3gb-row-when">适用：{s.when}</span>
                  <span className="t3gb-row-key">决策：{s.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t3gb-right">
          {step >= 0 && (
            <div className="t3gb-framework">
              <span className="t3gb-fw-title">一分钟初筛决策框架</span>
              <div className="t3gb-fw-rules">
                <span className="t3gb-fw-rule">关键帧占比 &lt; 5% → 事件触发</span>
                <span className="t3gb-fw-rule">5-20% → 均匀抽帧</span>
                <span className="t3gb-fw-rule">&gt; 20% → 均匀或混合策略</span>
              </div>
            </div>
          )}
          {step >= 1 && (
            <div className="t3gb-mixed">
              <span className="t3gb-mix-text">实际项目常用混合策略：</span>
              <span className="t3gb-mix-example">平时 I帧记录 + 事件触发 → 高频均匀抽帧</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3gb-next">
              <span className="t3gb-next-text">算账对比 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
