import type { ChapterStepProps } from "../../registry/types";
import "./Report.css";

export default function Report({ step }: ChapterStepProps) {
  return (
    <div className="rp-root scene-pad">
      <div className="rp-center">
        {step <= 4 && (
          <div className="rp-report-card">
            <div className="rp-card-header">
              <span className="rp-card-title">AI 项目验收报告</span>
              <span className={`rp-card-badge ${step >= 2 ? "rp-badge-fail" : ""}`}>{step >= 2 ? "验收不通过" : "实验室评估"}</span>
            </div>
            <div className="rp-card-body">
              {step >= 1 && (
                <div className="rp-row">
                  <span className="rp-key">模型实验室准确率</span>
                  <span className="rp-val rp-val-amber">95%</span>
                </div>
              )}
              {step >= 3 && (
                <div className="rp-row">
                  <span className="rp-key">业务端拦截率</span>
                  <span className="rp-val rp-val-red">提升 0%</span>
                </div>
              )}
              {step >= 4 && (
                <div className="rp-row">
                  <span className="rp-key">客诉率</span>
                  <span className="rp-val rp-val-red">反增</span>
                </div>
              )}
              {step >= 4 && (
                <div className="rp-row rp-row-verdict">
                  <span className="rp-verdict">建议停用</span>
                </div>
              )}
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="rp-commentary">
            {step >= 2 && <span className="rp-comment-text">实验室里猛如虎</span>}
            {step >= 3 && <span className="rp-comment-text rp-comment-accent">一上业务就添堵</span>}
          </div>
        )}
      </div>
    </div>
  );
}
