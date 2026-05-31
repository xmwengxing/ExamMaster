import type { ChapterStepProps } from "../../registry/types";
import "./S3Breakpoint.css";

export default function S3Breakpoint({ step }: ChapterStepProps) {
  return (
    <div className="s3k-root scene-pad">
      <div className="s3k-center">
        <div className="s3k-header">
          <span className="s3k-label">比数据分类更重要的</span>
          <span className="s3k-keyword">数据断点</span>
        </div>
        <div className="s3k-systems">
          <div className={`s3k-sys ${step >= 1 ? "s3k-sys-on" : ""}`}>
            <svg width="56" height="56" viewBox="0 0 64 64">
              <rect x="8" y="6" width="48" height="36" rx="3" stroke="var(--text-2)" strokeWidth="2" fill="none" />
              <path d="M16 20 L28 20 M16 28 L22 28" stroke="var(--text-mute)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="48" cy="44" r="14" stroke="var(--text-2)" strokeWidth="2" fill="none" />
            </svg>
            <span className="s3k-sys-name">呼叫中心系统</span>
            <span className="s3k-sys-data">通话录音</span>
          </div>
          {step >= 1 && (
            <div className="s3k-crack">
              <svg width="12" height="200" viewBox="0 0 12 200" preserveAspectRatio="none">
                <path d="M6 0 L6 30 L2 48 L9 60 L3 75 L10 90 L2 108 L8 122 L2 140 L9 155 L3 170 L10 182 L2 195 L6 200"
                  stroke="var(--accent)" strokeWidth="4" fill="none" strokeDasharray="240" strokeDashoffset="0" />
              </svg>
            </div>
          )}
          <div className={`s3k-sys ${step >= 1 ? "s3k-sys-on" : ""}`}>
            <svg width="56" height="56" viewBox="0 0 64 64">
              <rect x="10" y="4" width="44" height="56" rx="4" stroke="var(--text-2)" strokeWidth="2" fill="none" />
              <rect x="18" y="14" width="12" height="12" rx="2" fill="var(--accent-soft)" />
              <rect x="34" y="14" width="12" height="12" rx="2" fill="var(--accent-soft)" />
              <rect x="18" y="30" width="28" height="4" rx="2" fill="var(--surface-3)" />
            </svg>
            <span className="s3k-sys-name">CRM 系统</span>
            <span className="s3k-sys-data">客服工单</span>
          </div>
        </div>
        {step >= 2 && (
          <div className="s3k-discover">
            <span className="s3k-discover-q">两个系统之间</span>
            {step >= 3 && <span className="s3k-discover-a">User ID 从未打通</span>}
          </div>
        )}
        {step >= 4 && <span className="s3k-punch">录音与工单，永远对不上号</span>}
      </div>
    </div>
  );
}
