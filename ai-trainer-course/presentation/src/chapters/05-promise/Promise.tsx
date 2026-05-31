import type { ChapterStepProps } from "../../registry/types";
import "./Promise.css";

const FAKE_TAGS = ["智能客服", "AI 中台", "智能推荐", "无人值守", "自动决策"];

export default function Promise({ step }: ChapterStepProps) {
  return (
    <div className="pr-root scene-pad">
      <div className="pr-center">
        {step <= 2 && (
          <div className="pr-course-block">
            {step >= 0 && <span className="pr-course-label">今天这节课</span>}
            {step >= 1 && (
              <span className="pr-course-title">
                {step >= 1 ? "通用业务流程和业务数据" : ""}
              </span>
            )}
            {step >= 2 && (
              <div className="pr-tagline-group">
                <div className="pr-dashed" />
                <span className="pr-tagline">解开 AI 融入业务血脉的密码</span>
              </div>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="pr-tags-stage">
            <span className="pr-tags-label">伪 AI 需求</span>
            <div className="pr-tags-grid">
              {FAKE_TAGS.map((tag, i) => (
                <div key={i} className="pr-tag" style={{ animationDelay: `${i * 0.12}s` }}>
                  <span className="pr-tag-text">{tag}</span>
                  {step >= 4 && (
                    <svg className="pr-x" width="100%" height="100%" viewBox="0 0 120 42" preserveAspectRatio="none">
                      <path
                        d="M10 10 L90 32 M90 10 L10 32"
                        stroke="var(--accent)" strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="110" strokeDashoffset="110" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {step >= 4 && (
          <div className="pr-conclusion">
            <span className="pr-conclude-text">一眼看穿</span>
          </div>
        )}
      </div>
    </div>
  );
}
