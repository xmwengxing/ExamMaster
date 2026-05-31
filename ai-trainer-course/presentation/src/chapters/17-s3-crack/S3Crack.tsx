import type { ChapterStepProps } from "../../registry/types";
import "./S3Crack.css";

export default function S3Crack({ step }: ChapterStepProps) {
  return (
    <div className="s3r-root scene-pad">
      <div className="s3r-center">
        <div className="s3r-systems">
          <div className="s3r-sys">
            <span className="s3r-sys-name">呼叫中心系统</span>
            <span className="s3r-sys-data">录音文件</span>
            <svg className="s3r-data-line" width="200" height="4">
              <line x1="0" y1="2" x2="200" y2="2" stroke="var(--accent)" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
            </svg>
          </div>
          <div className="s3r-gap">
            <svg width="80" height="120" viewBox="0 0 80 120">
              <path d="M40 10 L10 40 L50 65 L20 90 L45 110" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round"
                strokeDasharray="100" strokeDashoffset="100" />
            </svg>
            <span className="s3r-gap-label">数据断点</span>
          </div>
          <div className="s3r-sys">
            <span className="s3r-sys-name">CRM 系统</span>
            <span className="s3r-sys-data">客服工单</span>
            <svg className="s3r-data-line" width="200" height="4">
              <line x1="0" y1="2" x2="200" y2="2" stroke="var(--accent)" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
            </svg>
          </div>
        </div>
        <div className="s3r-connector">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`s3r-conn-line ${step >= 1 ? "s3r-conn-broken" : ""}`} style={{ top: 20 + i * 24 }} />
          ))}
        </div>
        {step >= 2 && (
          <div className="s3r-verdict">
            <span className="s3r-verdict-line">手工对齐两个系统的数据</span>
            {step >= 3 && <span className="s3r-verdict-line s3r-verdict-big">几百人天的工作量</span>}
          </div>
        )}
      </div>
    </div>
  );
}
