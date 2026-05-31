import type { ChapterStepProps } from "../../registry/types";
import "./CoreBarrier.css";

export default function CoreBarrier({ step }: ChapterStepProps) {
  return (
    <div className="t3cb-root scene-pad">
      <div className="t3cb-layout">
        <div className="t3cb-left">
          <div className="t3cb-summary">
            <span className="t3cb-sum-title">S4 核心回顾</span>
            <div className="t3cb-sum-cards">
              <div className="t3cb-card">
                <span className="t3cb-card-icon">🛡️</span>
                <span className="t3cb-card-title">视频脱敏</span>
                <span className="t3cb-card-desc">自动化·前置化·不可越过法律红线</span>
              </div>
              <div className="t3cb-card">
                <span className="t3cb-card-icon">👻</span>
                <span className="t3cb-card-title">ID跳变</span>
                <span className="t3cb-card-desc">三条规则·递进式判断·转译方法论</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3cb-right">
          {step >= 1 && (
            <div className="t3cb-value">
              <span className="t3cb-value-text">把物理世界的复杂规律，翻译成一套可操作的标注规范</span>
              <span className="t3cb-value-sub">这个能力，只有你能做</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3cb-next">
              <span className="t3cb-next-text">S5：全课复盘与通关考核 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
