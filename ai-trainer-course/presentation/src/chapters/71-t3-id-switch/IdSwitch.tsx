import type { ChapterStepProps } from "../../registry/types";
import "./IdSwitch.css";

export default function IdSwitch({ step }: ChapterStepProps) {
  return (
    <div className="t3is-root scene-pad">
      <div className="t3is-layout">
        <div className="t3is-left">
          <div className="t3is-scene">
            <span className="t3is-scene-label">真实场景</span>
            <div className="t3is-track-demo">
              <div className="t3is-track-phase">
                <span className="t3is-track-frame">🔴 ID:001</span>
                <span className="t3is-track-arrow">→</span>
                <span className="t3is-track-frame t3is-track-occlude">⬛ 遮挡</span>
                <span className="t3is-track-arrow">→</span>
                <span className="t3is-track-frame">🔵 ID:002</span>
              </div>
              <span className="t3is-track-error">同一个工人 → 被识别为两个人</span>
            </div>
          </div>
        </div>
        <div className="t3is-right">
          {step >= 1 && (
            <div className="t3is-cause">
              <span className="t3is-cause-title">根因：遮挡恢复失败</span>
              <span className="t3is-cause-desc">目标被遮挡 → 视觉信号丢失 → 重现后无法关联原ID</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3is-consequences">
              <span className="t3is-cons-title">后果</span>
              <span className="t3is-cons-item">📊 客流量统计 → 人数严重虚高</span>
              <span className="t3is-cons-item">🚗 自动驾驶 → 道路车辆数量错误</span>
              <span className="t3is-cons-item">🏗 工地安防 → 人员计数混乱</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3is-hidden">
              <span className="t3is-hidden-text">标注员看不到帧间关联 → 1000人1000种ID → 数据一致性崩塌</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t3is-next">
              <span className="t3is-next-text">如何用规则消灭ID跳变？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
