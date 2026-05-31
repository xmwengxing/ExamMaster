import type { ChapterStepProps } from "../../registry/types";
import "./Recap.css";

const MODULES = [
  { num: "01", title: "抽帧三剑客", key: "均匀·I帧·事件触发：关键信息帧占比决策框架", icon: "⚔️" },
  { num: "02", title: "算账对比", key: "方案A ¥173万/天 vs 方案B ¥4.3万/天", icon: "💰" },
  { num: "03", title: "脱敏与ID跳变", key: "法律底线 + 三条递进式规则", icon: "🛡️" },
];

export default function Recap({ step }: ChapterStepProps) {
  return (
    <div className="t3r-root scene-pad">
      <div className="t3r-layout">
        <div className="t3r-left">
          <span className="t3r-title">本课复盘</span>
          <div className="t3r-modules">
            {MODULES.map((m, i) => (
              <div key={m.num} className={`t3r-mod ${i <= step - 1 ? "t3r-mod-on" : "t3r-mod-off"}`}>
                <span className="t3r-mod-num">{m.num}</span>
                <span className="t3r-mod-icon">{m.icon}</span>
                <div className="t3r-mod-body">
                  <span className="t3r-mod-title">{m.title}</span>
                  <span className="t3r-mod-key">{m.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t3r-right">
          {step >= 3 && (
            <div className="t3r-verdict">
              <span className="t3r-verdict-text">抽帧策略 → 成本控制 → 合规与质量</span>
              <span className="t3r-verdict-sub">视频训练师的完整能力闭环</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
