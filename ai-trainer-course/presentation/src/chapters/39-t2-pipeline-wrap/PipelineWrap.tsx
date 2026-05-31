import type { ChapterStepProps } from "../../registry/types";
import "./PipelineWrap.css";

export default function PipelineWrap({ step }: ChapterStepProps) {
  return (
    <div className="t2pw-root scene-pad">
      <div className="t2pw-center">
        {step >= 0 && (
          <div className="t2pw-motto-stage">
            <span className="t2pw-motto-number">01</span>
            <span className="t2pw-motto-text">合规优先</span>
          </div>
        )}
        {step >= 1 && (
          <div className="t2pw-summary-stage">
            <div className="t2pw-summary-cards">
              <div className="t2pw-summary-card t2pw-card-red">
                <span className="t2pw-card-icon">🛡️</span>
                <span className="t2pw-card-title">脱敏是红线</span>
                <span className="t2pw-card-desc">PII不可流入训练池</span>
              </div>
              <div className="t2pw-summary-card">
                <span className="t2pw-card-icon">🧹</span>
                <span className="t2pw-card-title">清洗是基本功</span>
                <span className="t2pw-card-desc">去噪·去标签·统一格式</span>
              </div>
              <div className="t2pw-summary-card t2pw-card-accent">
                <span className="t2pw-card-icon">📐</span>
                <span className="t2pw-card-title">转换+增强</span>
                <span className="t2pw-card-desc">结构化·扩样本</span>
              </div>
            </div>
            <span className="t2pw-final-tag">五步流水线 = 文本数据处理的通用框架</span>
          </div>
        )}
        {step >= 2 && (
          <div className="t2pw-bridge">
            <span className="t2pw-bridge-text">实战检验：车机语音日志清洗 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
