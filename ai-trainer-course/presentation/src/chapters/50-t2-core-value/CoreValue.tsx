import type { ChapterStepProps } from "../../registry/types";
import "./CoreValue.css";

export default function CoreValue({ step }: ChapterStepProps) {
  return (
    <div className="cv-root scene-pad">
      <div className="cv-layout">
        <div className="cv-left">
          <div className="cv-chain">
            <span className="cv-chain-title">AI产业链谁最难被替代？</span>
            <div className="cv-chain-items">
              <div className={`cv-chain-item ${step >= 0 ? "cv-chain-on" : ""}`}>
                <span className="cv-chain-role">算法工程师</span>
                <span className="cv-chain-risk">可被开源模型替代</span>
              </div>
              <div className={`cv-chain-item ${step >= 0 ? "cv-chain-on" : ""}`}>
                <span className="cv-chain-role">标注员</span>
                <span className="cv-chain-risk">可被自动化工具替代</span>
              </div>
              <div className={`cv-chain-item cv-chain-safe ${step >= 1 ? "cv-chain-on" : ""}`}>
                <span className="cv-chain-role">训练师</span>
                <span className="cv-chain-risk">最难替代 —— 模糊需求 → 精确规则</span>
              </div>
            </div>
          </div>
        </div>
        <div className="cv-right">
          {step >= 2 && (
            <div className="cv-salary">
              <span className="cv-salary-title">企业计算出的真实价值</span>
              <div className="cv-salary-compare">
                <div className="cv-salary-item">
                  <span className="cv-salary-num">¥1,000w</span>
                  <span className="cv-salary-label">GPU训练大模型</span>
                </div>
                <div className="cv-salary-vs">
                  <span className="cv-salary-vs-text">vs</span>
                </div>
                <div className="cv-salary-item cv-salary-win">
                  <span className="cv-salary-num">¥100w</span>
                  <span className="cv-salary-label">好的训练师把数据做扎实</span>
                </div>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="cv-final">
              <span className="cv-final-quote">把模糊语感 → 翻译成绝对规则</span>
              <span className="cv-final-sub">你拿高薪的理由 · AI时代安身立命的根本</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
