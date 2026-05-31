import type { ChapterStepProps } from "../../registry/types";
import "./S4Pause.css";

export default function S4Pause({ step }: ChapterStepProps) {
  return (
    <div className="s4p-root scene-pad">
      <div className="s4p-center">
        <div className="s4p-qmark">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="8 6" opacity="0.35" />
            <text x="80" y="95" textAnchor="middle" fontFamily="var(--font-display-en)" fontSize="72" fontWeight="400" fill="var(--accent)">?</text>
          </svg>
        </div>
        <div className="s4p-text">
          <span className="s4p-title">按下暂停键</span>
          <span className="s4p-desc">用全链路闭环的视角，找出缺失的致命节点</span>
          {step >= 2 && <span className="s4p-timer">30秒独立思考</span>}
        </div>
        {step >= 3 && (
          <span className="s4p-encourage">找到漏洞，你的思维已在向训练师转变</span>
        )}
      </div>
    </div>
  );
}
