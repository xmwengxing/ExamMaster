import type { ChapterStepProps } from "../../registry/types";
import "./IdSolution.css";

const RULES = [
  { num: "01", title: "遮挡时间阈值", desc: "<3秒 + 运动一致性保持 → 保持原ID" },
  { num: "02", title: "外观特征比对", desc: "6项特征(服色/性别/身高/方向/姿态/物品) ≥4项匹配 → 同目标" },
  { num: "03", title: "虚拟预测框", desc: "遮挡期间画预测框 · 重现后IoU>50% → 同目标" },
];

const FEATURES = ["服装主色调", "性别特征", "身高比例", "运动方向", "行走姿态", "携带物品"];

export default function IdSolution({ step }: ChapterStepProps) {
  return (
    <div className="t3is2-root scene-pad">
      <div className="t3is2-layout">
        <div className="t3is2-left">
          <span className="t3is2-title">消灭ID跳变的三条规则</span>
          <div className="t3is2-rules">
            {RULES.map((r, i) => (
              <div key={r.num} className={`t3is2-rule ${i <= step - 1 ? "t3is2-rule-on" : "t3is2-rule-off"}`}>
                <span className="t3is2-rule-num">{r.num}</span>
                <div className="t3is2-rule-body">
                  <span className="t3is2-rule-title">{r.title}</span>
                  <span className="t3is2-rule-desc">{r.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t3is2-right">
          {step >= 1 && (
            <div className="t3is2-features">
              <span className="t3is2-feat-title">外观特征比对清单</span>
              <div className="t3is2-feat-grid">
                {FEATURES.map((f) => (
                  <span key={f} className="t3is2-feat-item">{f}</span>
                ))}
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t3is2-flow">
              <span className="t3is2-flow-text">时间阈值 → 外观比对 → 预测框验证</span>
              <span className="t3is2-flow-note">三条规则层层递进 · 物理规律 → 标准化流程</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t3is2-next">
              <span className="t3is2-next-text">训练师核心壁垒 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
