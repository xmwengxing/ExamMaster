import type { ChapterStepProps } from "../../registry/types";
import "./Identity.css";

export default function Identity({ step }: ChapterStepProps) {
  return (
    <div className="id-root scene-pad">
      <div className="id-center">
        {step <= 2 && (
          <div className="id-declaration">
            {step >= 0 && <span className="id-decl-q">为什么会这样？</span>}
            {step >= 1 && (
              <div className="id-decl-a">
                <span className="id-decl-line">脱离了</span>
                <span className="id-decl-line">业务流程的 AI</span>
                {step >= 2 && <span className="id-decl-punch">只是一堆毫无意义的代码</span>}
              </div>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="id-role-stage">
            <div className="id-role-card id-role-old">
              <span className="id-role-label">旧身份</span>
              <span className={`id-role-name ${step >= 4 ? "id-struck" : ""}`}>数据标注员</span>
            </div>
            <div className="id-role-arrow">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M12 32 L46 32 M36 22 L48 32 L36 42"
                  stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="id-role-card id-role-new">
              <span className="id-role-label id-label-accent">新身份</span>
              {step >= 5 && <span className="id-role-name id-name-accent">翻译官</span>}
              {step >= 6 && <span className="id-role-name id-name-accent">架构师</span>}
            </div>
            {step >= 7 && (
              <span className="id-role-summary">连接算法与业务的桥梁</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
