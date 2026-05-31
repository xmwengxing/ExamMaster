import type { ChapterStepProps } from "../../registry/types";
import "./DirtyLog.css";

export default function DirtyLog({ step }: ChapterStepProps) {
  return (
    <div className="dl-root scene-pad">
      <div className="dl-layout">
        <div className="dl-log-panel">
          <div className="dl-log-header">
            <span className="dl-log-filename">📄 car_voice_log_20260526.txt</span>
            <span className="dl-log-badge">原始日志</span>
          </div>
          <div className="dl-log-body">
            <div className="dl-log-line dl-log-line-meta">
              <span className="dl-tag-meta">[2026-05-26 14:32:18]</span>
              <span className="dl-tag-meta">User_ID: u_8842</span>
            </div>
            <div className={`dl-log-line ${step >= 1 ? "dl-hl" : ""}`}>
              <span className="dl-tag-html">{"<br>"}</span>
            </div>
            <div className="dl-log-line">
              <span className="dl-tag-text">帮我导航到</span>
              <span className={`dl-tag-phone ${step >= 2 ? "dl-alert" : "dl-dim"}`}>138xxxx5678</span>
              <span className="dl-tag-text">那个老王家开的超市，</span>
            </div>
            <div className="dl-log-line">
              <span className="dl-tag-text">顺便放点</span>
              <span className={`dl-tag-noise ${step >= 2 ? "dl-alert" : "dl-dim"}`}>...噪音...</span>
            </div>
            <div className={`dl-log-line ${step >= 3 ? "dl-hl" : ""}`}>
              <span className="dl-tag-hash">#导航失败#</span>
            </div>
          </div>
        </div>
        <div className="dl-analysis-panel">
          {step >= 2 && (
            <div className="dl-problem-list">
              <span className="dl-problem-title">🔍 这条日志的问题</span>
              {[
                { label: "HTML标签", desc: "<br> 系统日志残留", show: step >= 1 },
                { label: "隐私泄露", desc: "手机号明码显示", show: step >= 2 },
                { label: "噪音污染", desc: "风声误识别为\"噪音\"", show: step >= 2 },
                { label: "意图混杂", desc: "导航 + 音乐混在一起", show: step >= 3 },
              ].map((p, _i) => (
                <div key={p.label} className={`dl-problem ${p.show ? "dl-problem-on" : "dl-problem-off"}`}>
                  <span className="dl-problem-label">{p.label}</span>
                  <span className="dl-problem-desc">{p.desc}</span>
                </div>
              ))}
            </div>
          )}
          {step >= 4 && (
            <div className="dl-solution-tease">
              <span className="dl-tease-text">不是删掉它，而是做手术切除病灶。</span>
              <span className="dl-tease-sub">三刀手术法：去噪 · 脱敏 · 拆分</span>
            </div>
          )}
          {step >= 5 && (
            <div className="dl-think">
              <span className="dl-think-icon">⏱</span>
              <span className="dl-think-text">如果你是训练师，第一刀从哪里下？</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
