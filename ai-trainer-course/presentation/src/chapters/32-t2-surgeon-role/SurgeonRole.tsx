import type { ChapterStepProps } from "../../registry/types";
import "./SurgeonRole.css";

export default function SurgeonRole({ step }: ChapterStepProps) {
  return (
    <div className="sr-root scene-pad">
      <div className="sr-center">
        {step <= 2 && (
          <div className="sr-role-stage">
            {step >= 0 && <span className="sr-question">人工智能训练师 = ？</span>}
            {step >= 1 && (
              <div className="sr-reject">
                <span className="sr-reject-text">传声筒</span>
                <svg className="sr-x" width="100%" height="100%" viewBox="0 0 220 60" preserveAspectRatio="none">
                  <path d="M15 12 L205 48 M205 12 L15 48"
                    stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray="280" strokeDashoffset="280" />
                </svg>
              </div>
            )}
            {step >= 2 && (
              <div className="sr-replace">
                <span className="sr-replace-text">AI早就可以替代传声筒了</span>
              </div>
            )}
          </div>
        )}
        {step >= 3 && step <= 5 && (
          <div className="sr-surgeon-stage">
            <div className={`sr-definition ${step >= 3 ? "sr-def-on" : ""}`}>
              <span className="sr-def-kicker">真正的训练师是</span>
              <span className="sr-def-title">数据外科医生</span>
            </div>
            <div className="sr-tools">
              {[
                { icon: "🔪", label: "清洗去噪", desc: "清创消毒", show: step >= 4 },
                { icon: "🛡️", label: "脱敏处理", desc: "切除风险组织", show: step >= 4 },
                { icon: "📐", label: "规则制定", desc: "标准化手术流程", show: step >= 5 },
              ].map((t, _i) => (
                <div key={t.label} className={`sr-tool-card ${t.show ? "sr-tool-on" : "sr-tool-off"}`}>
                  <span className="sr-tool-icon">{t.icon}</span>
                  <span className="sr-tool-label">{t.label}</span>
                  <span className="sr-tool-desc">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {step >= 6 && (
          <div className="sr-transform">
            <div className="sr-left">
              <span className="sr-mud-label">原生态泥巴</span>
              <div className="sr-mud-block">
                <span className="sr-mud-text">脏数据 · 乱码 · 隐私泄露 · 歧义</span>
              </div>
            </div>
            <div className="sr-arrow">
              <svg width="120" height="24" viewBox="0 0 120 24">
                <path d="M0 12 L110 12 M100 4 L112 12 L100 20"
                  stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  strokeDasharray="130" strokeDashoffset="130" />
              </svg>
            </div>
            <div className="sr-right">
              <span className="sr-fuel-label">高纯度燃料</span>
              <div className="sr-fuel-block">
                <span className="sr-fuel-text">结构化 · 合规 · 清洁 · 一致</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
