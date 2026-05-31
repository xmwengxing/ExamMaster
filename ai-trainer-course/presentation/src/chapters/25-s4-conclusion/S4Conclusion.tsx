import type { ChapterStepProps } from "../../registry/types";
import "./S4Conclusion.css";

export default function S4Conclusion({ step }: ChapterStepProps) {
  return (
    <div className="s4c-root scene-pad">
      <div className="s4c-center">
        <span className="s4c-strike">不看画了多少框</span>
        <div className="s4c-hero">
          <span className="s4c-hero-line">只看数据</span>
          <span className="s4c-hero-line s4c-hero-accent">有没有形成闭环</span>
        </div>
        {step >= 1 && (
          <div className="s4c-flow-closed">
            <span className="s4c-flow-closed-label">完整业务闭环</span>
            <div className="s4c-flow-closed-nodes">
              <span className="s4c-cl-node">输入数据源</span>
              <span className="s4c-cl-arrow">→</span>
              <span className="s4c-cl-node">AI推荐</span>
              <span className="s4c-cl-arrow">→</span>
              <span className="s4c-cl-node">下单</span>
              <span className="s4c-cl-arrow">→</span>
              <span className="s4c-cl-node">结账</span>
              <span className="s4c-cl-arrow s4c-cl-loop">↻</span>
              <span className="s4c-cl-node s4c-cl-fb">反馈</span>
            </div>
          </div>
        )}
        {step >= 2 && (
          <span className="s4c-bottom">这就是三级训练师该有的业务嗅觉</span>
        )}
      </div>
    </div>
  );
}
