import type { ChapterStepProps } from "../../registry/types";
import "./LabelChaos.css";

export default function LabelChaos({ step }: ChapterStepProps) {
  return (
    <div className="lc-root scene-pad">
      <div className="lc-layout">
        <div className="lc-left">
          <div className="lc-experiment">
            <span className="lc-exp-title">实验：50人 × 1条评论 × 0规则</span>
            <div className="lc-bars">
              {[
                { label: "好评", count: 22, color: "lc-bar-good", show: step >= 1 },
                { label: "差评", count: 19, color: "lc-bar-bad", show: step >= 1 },
                { label: "中性", count: 9, color: "lc-bar-neut", show: step >= 2 },
              ].map((b) => (
                <div key={b.label} className={`lc-bar-group ${b.show ? "lc-bar-on" : "lc-bar-off"}`}>
                  <span className="lc-bar-label">{b.label}</span>
                  <div className="lc-bar-track">
                    <div className={`lc-bar-fill ${b.color}`} style={{ width: `${b.count * 2}px` }} />
                    <span className="lc-bar-count">{b.count}人</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lc-right">
          {step >= 2 && (
            <div className="lc-consequence">
              <span className="lc-consequence-title">50个标注员 → 3种答案</span>
              <span className="lc-consequence-sub">标签互相矛盾，一致性崩塌</span>
            </div>
          )}
          {step >= 3 && (
            <div className="lc-ceiling">
              <span className="lc-ceiling-big">70%</span>
              <span className="lc-ceiling-text">标注一致性 → 模型准确率天花板</span>
              <span className="lc-ceiling-note">无论用什么最先进的模型架构，都无法突破</span>
            </div>
          )}
          {step >= 4 && (
            <div className="lc-truth">
              <span className="lc-truth-title">真相：</span>
              <span className="lc-truth-text">不是算法不行，是标注数据有30%的歧义没有解决</span>
            </div>
          )}
          {step >= 5 && (
            <div className="lc-solution">
              <span className="lc-solution-label">解决方案</span>
              <span className="lc-solution-name">标注指南 Guideline</span>
              <span className="lc-solution-effect">数据一致性 70% → 90%+</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
