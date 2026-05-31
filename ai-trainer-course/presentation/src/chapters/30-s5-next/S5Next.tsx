import type { ChapterStepProps } from "../../registry/types";
import "./S5Next.css";

export default function S5Next({ step }: ChapterStepProps) {
  return (
    <div className="s5n-root scene-pad">
      <div className="s5n-center">
        <span className="s5n-label">下节课</span>
        <span className="s5n-title">文本类业务数据处理</span>
        <div className="s5n-transform">
          <div className="s5n-before">
            <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
              <rect x="4" y="4" width="56" height="56" rx="6" stroke="var(--text-faint)" strokeWidth="2" />
              <path d="M16 24 L28 24 M16 32 L20 32 M36 24 L48 24 M36 32 L44 32" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 42 Q32 48 42 42" stroke="var(--text-faint)" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="s5n-tf-label">脏数据</span>
          </div>
          <span className="s5n-arrow">→</span>
          <div className="s5n-after">
            <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
              <polygon points="32,8 38,24 56,24 42,34 48,50 32,40 16,50 22,34 8,24 26,24" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
            </svg>
            <span className="s5n-tf-label s5n-accent">变废为宝</span>
          </div>
        </div>
        <div className="s5n-farewell">
          <span className="s5n-fw-line">我是翁老师</span>
          {step >= 1 && <span className="s5n-fw-line s5n-fw-bye">下节课，不见不散</span>}
        </div>
      </div>
    </div>
  );
}
