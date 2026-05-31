import type { ChapterStepProps } from "../../registry/types";
import "./S2Myth.css";

export default function S2Myth({ step }: ChapterStepProps) {
  return (
    <div className="my-root scene-pad">
      <div className="my-center">
        {step <= 2 && (
          <div className="my-formula">
            <div className="my-chips">
              <span className={`my-chip ${step >= 0 ? "my-chip-show" : ""}`}>拿数据</span>
              <span className="my-plus">+</span>
              <span className={`my-chip ${step >= 0 ? "my-chip-show" : ""}`}>训模型</span>
              <span className="my-plus">+</span>
              <span className={`my-chip ${step >= 0 ? "my-chip-show" : ""}`}>交差</span>
            </div>
            {step >= 1 && (
              <div className="my-cross">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <path d="M20 20 L140 140 M140 20 L20 140"
                    stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray="180" strokeDashoffset="0" />
                </svg>
              </div>
            )}
            {step >= 2 && (
              <span className="my-busted">大错特错</span>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="my-reveal">
            <span className="my-reveal-label">真正的 AI 项目是</span>
            <div className="my-reveal-big">
              <span className={`my-reveal-word ${step >= 3 ? "my-reveal-on" : ""}`}>全链路</span>
              <span className={`my-reveal-word ${step >= 4 ? "my-reveal-on" : ""}`}>业务闭环</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
