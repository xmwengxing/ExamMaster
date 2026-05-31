import type { ChapterStepProps } from "../../registry/types";
import "./S3Consequence.css";

export default function S3Consequence({ step }: ChapterStepProps) {
  return (
    <div className="s3c-root scene-pad">
      <div className="s3c-center">
        {step <= 2 && (
          <>
            <div className="s3c-cards">
              <div className={`s3c-card ${step >= 0 ? "s3c-card-on" : ""}`} style={{ animationDelay: "0s" }}>
                <span className="s3c-card-label">项目延期</span>
                <span className="s3c-card-big">≥ 30 天</span>
              </div>
              <div className={`s3c-card ${step >= 1 ? "s3c-card-on" : ""}`} style={{ animationDelay: "0.15s" }}>
                <span className="s3c-card-label">研发费用损失</span>
                <span className="s3c-card-big">≥ 500 万</span>
              </div>
            </div>
            {step >= 2 && (
              <div className="s3c-bar-wrap">
                <span className="s3c-bar-label">项目进度被强制倒退</span>
                <div className="s3c-bar-track">
                  <div className={`s3c-bar-fill ${step >= 2 ? "s3c-bar-shrink" : ""}`} />
                </div>
              </div>
            )}
          </>
        )}
        {step >= 3 && (
          <div className="s3c-lesson">
            <span className="s3c-lesson-line">本该在需求阶段就避免的损失</span>
            <span className="s3c-lesson-line s3c-lesson-accent">这是三级训练师的专业尊严所在</span>
          </div>
        )}
      </div>
    </div>
  );
}
