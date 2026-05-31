import type { ChapterStepProps } from "../../registry/types";
import "./DeidentifyRedline.css";

const PII_TYPES = [
  { label: "姓名", example: "翁某某" },
  { label: "手机号", example: "138****5678" },
  { label: "身份证号", example: "310***19900101****" },
  { label: "银行卡号", example: "6222****1234" },
  { label: "邮箱地址", example: "user@example.com" },
  { label: "家庭住址", example: "北京市海淀区***" },
];

export default function DeidentifyRedline({ step }: ChapterStepProps) {
  return (
    <div className="t2dr-root scene-pad">
      <div className="t2dr-center">
        {step <= 5 && (
          <div className="t2dr-pii-stage">
            <div className="t2dr-chat-preview">
              <div className="t2dr-chat-header">
                <span className="t2dr-chat-title">客服聊天记录 — PII 个人敏感信息</span>
              </div>
              <div className="t2dr-chat-body">
                {PII_TYPES.map((p, i) => (
                  <div key={p.label} className={`t2dr-pii-row ${i <= step - 1 ? "t2dr-pii-hl" : "t2dr-pii-dim"}`}>
                    <span className="t2dr-pii-label">{p.label}</span>
                    <span className="t2dr-pii-value">{i <= step - 1 ? p.example : "••••••••••••"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="t2dr-redline-stage">
            <div className="t2dr-redline-bar" />
            <span className="t2dr-redline-icon">⛔</span>
            <span className="t2dr-redline-text">未经脱敏的隐私数据，绝对不允许流入模型训练池</span>
          </div>
        )}
        {step >= 4 && (
          <div className="t2dr-legal">
            <span className="t2dr-legal-title">《个人信息保护法》</span>
            <span className="t2dr-legal-desc">罚款可达上年营业额5% · 刑事责任</span>
          </div>
        )}
        {step >= 5 && (
          <div className="t2dr-motto">
            <span className="t2dr-motto-number">01</span>
            <span className="t2dr-motto-text">合规优先 — 高于一切技术指标</span>
          </div>
        )}
        {step >= 6 && (
          <div className="t2dr-next">
            <span className="t2dr-next-text">怎么实现脱敏？看两套技术工具 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
