import type { ChapterStepProps } from "../../registry/types";
import "./S2Valve.css";

const GEARS = ["需求定义", "数据准备", "模型训练", "系统集成", "运营迭代"];

export default function S2Valve({ step }: ChapterStepProps) {
  return (
    <div className="vl-root scene-pad">
      <div className="vl-center">
        {step <= 1 && (
          <div className="vl-valve-icon">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="44" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="3" />
              <path d="M40 46 L60 60 L80 46" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="60" y1="60" x2="60" y2="80" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="vl-valve-label">AI 智能阀门</span>
          </div>
        )}
        {step >= 1 && (
          <div className="vl-gear-grid">
            {GEARS.map((g, i) => (
              <div key={g} className={`vl-gear-item ${i < step ? "vl-gear-fail" : ""}`} style={{ animationDelay: `${i * 0.25}s` }}>
                <svg width="100" height="100" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke={i < step ? "var(--text-faint)" : "var(--accent)"}
                    strokeWidth="14" strokeDasharray="10 12" opacity={i < step ? 0.15 : 1} />
                  <circle cx="90" cy="90" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
                </svg>
                {i < step && (
                  <svg className="vl-gear-x" width="100" height="100" viewBox="0 0 100 100">
                    <path d="M15 15 L85 85 M85 15 L15 85" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="100" strokeDashoffset="0" />
                  </svg>
                )}
                <span className={`vl-gear-name ${i < step ? "vl-name-fail" : ""}`}>{g}</span>
              </div>
            ))}
          </div>
        )}
        {step >= 2 && (
          <div className="vl-punch">
            <span className="vl-punch-line">任何一个齿轮卡壳</span>
            {step >= 3 && <span className="vl-punch-line vl-punch-accent">整个业务就会停摆</span>}
          </div>
        )}
      </div>
    </div>
  );
}
