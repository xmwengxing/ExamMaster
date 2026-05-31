import type { ChapterStepProps } from "../../registry/types";
import "./SwordEvent.css";

export default function SwordEvent({ step }: ChapterStepProps) {
  return (
    <div className="t3se-root scene-pad">
      <div className="t3se-layout">
        <div className="t3se-left">
          <div className="t3se-header">
            <span className="t3se-num">第三剑</span>
            <span className="t3se-name">事件触发抽帧</span>
            <span className="t3se-sub">高级训练师的标志性技能</span>
          </div>
          <div className="t3se-triggers">
            <span className="t3se-trig-title">触发信号源</span>
            <div className="t3se-trig-types">
              <div className="t3se-trig">
                <span className="t3se-trig-icon">👁</span>
                <span className="t3se-trig-name">像素差分检测</span>
                <span className="t3se-trig-note">视觉层面运动检测</span>
              </div>
              <div className="t3se-trig">
                <span className="t3se-trig-icon">📡</span>
                <span className="t3se-trig-name">物理传感器IO</span>
                <span className="t3se-trig-note">门禁·红外·光电传感器</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3se-right">
          {step >= 2 && (
            <div className="t3se-case">
              <span className="t3se-case-title">案例：工地未戴安全帽检测</span>
              <div className="t3se-case-flow">
                <span className="t3se-case-step">人员进入 → 触发抽帧 5 FPS</span>
                <span className="t3se-case-step">人员在区域中 → 持续记录</span>
                <span className="t3se-case-step">人员离开 → 停止抽帧</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t3se-result">
              <span className="t3se-result-item">几百万帧/天 → 几万帧/天</span>
              <span className="t3se-result-item">全是包含目标的"干货"</span>
              <span className="t3se-result-item">标注成本大幅下降 · 训练效率显著提升</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t3se-motto">
              <span className="t3se-motto-icon">💡</span>
              <span className="t3se-motto-text">没有业务事件触发的帧</span>
              <span className="t3se-motto-big">99% 是电子垃圾</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
