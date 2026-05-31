import type { ChapterStepProps } from "../../registry/types";
import "./FusionConflict.css";

export default function FusionConflict({ step }: ChapterStepProps) {
  return (
    <div className="t5fc-root scene-pad">
      <div className="t5fc-layout">
        <div className="t5fc-header">
          <span className="t5fc-eyebrow">S4 · 多传感器融合仲裁</span>
          <h2 className="t5fc-title">Camera-LiDAR融合：数据打架怎么判？</h2>
        </div>

        <div className="t5fc-split">
          <div className="t5fc-panel t5fc-panel--cam">
            <span className="t5fc-panel-label">📷 摄像头图像</span>
            <div className="t5fc-scene t5fc-scene--cam">
              {step >= 1 && <div className="t5fc-car t5fc-car--cam" />}
            </div>
            {step >= 3 && (
              <div className="t5fc-badge t5fc-badge--high">
                <span>目标清晰</span>
              </div>
            )}
          </div>

          <div className="t5fc-vs">
            <span>VS</span>
          </div>

          <div className="t5fc-panel t5fc-panel--lidar">
            <span className="t5fc-panel-label">📡 点云数据</span>
            <div className="t5fc-scene t5fc-scene--lidar">
              {step >= 1 && (
                <>
                  <div className="t5fc-noise t5fc-noise--1" />
                  <div className="t5fc-noise t5fc-noise--2" />
                  <div className="t5fc-noise t5fc-noise--3" />
                </>
              )}
              {step >= 2 && <div className="t5fc-sparse-dot" />}
              {step >= 4 && (
                <div className="t5fc-badge t5fc-badge--low">
                  <span>数据缺失</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {step >= 2 && (
          <div className="t5fc-question">
            <span className="t5fc-question-icon">❓</span>
            <span className="t5fc-question-text">
              图像里有，点云里没有——3D框该怎么拉？
            </span>
          </div>
        )}

        {step >= 3 && (
          <div className="t5fc-dilemma">
            <div className="t5fc-dilemma-card">
              <span>以图像为准</span>
              <span className="t5fc-dilemma-consequence">→ 纯点云推理时彻底瞎掉</span>
            </div>
            <div className="t5fc-dilemma-card">
              <span>以点云为准</span>
              <span className="t5fc-dilemma-consequence">→ 这辆车漏检了</span>
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="t5fc-answer">
            <span className="t5fc-answer-text">
              答案：置信度分级 + 虚拟3D框插值规则 →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}