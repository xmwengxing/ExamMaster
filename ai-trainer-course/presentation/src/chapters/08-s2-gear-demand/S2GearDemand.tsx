import type { ChapterStepProps } from "../../registry/types";
import "./S2GearDemand.css";

export default function S2GearDemand({ step }: ChapterStepProps) {
  return (
    <div className="gd-root scene-pad">
      <div className="gd-center">
        <span className="gd-label">第一个齿轮：需求定义</span>
        {step <= 1 && (
          <div className="gd-stack">
            {step >= 0 && (
              <div className="gd-bubble">
                <span className="gd-bubble-text">「我要一个智能客服」</span>
                <span className="gd-bubble-tag gd-tag-wish">愿望</span>
              </div>
            )}
            {step >= 1 && (
              <svg width="40" height="40" viewBox="0 0 40 40" className="gd-arrow-down">
                <path d="M20 8 L20 28 M12 20 L20 28 L28 20" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
            {step >= 1 && (
              <div className="gd-bubble gd-bubble-metric">
                <span className="gd-bubble-text">M1 首问拦截率</span>
                <span className="gd-metric-big">+30%</span>
                <span className="gd-bubble-tag gd-tag-metric">可度量的业务指标</span>
              </div>
            )}
          </div>
        )}
        {step >= 2 && (
          <div className="gd-conclusion">
            <span className="gd-conc-line">把愿望翻译成指标</span>
            {step >= 3 && <span className="gd-conc-line gd-conc-accent">是训练师不可替代的价值</span>}
          </div>
        )}
      </div>
    </div>
  );
}
