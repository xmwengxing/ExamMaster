import type { ChapterStepProps } from "../../registry/types";
import "./PhysicsFlaw.css";

export default function PhysicsFlaw({ step }: ChapterStepProps) {
  return (
    <div className="t5pf-root scene-pad">
      <div className="t5pf-layout">
        <div className="t5pf-left">
          <div className="t5pf-question">
            <span className="t5pf-q-text">为什么有缺陷的LiDAR反而是核心传感器？</span>
          </div>
          <div className="t5pf-answer">
            <div className="t5pf-ans-card t5pf-ans-camera">
              <span className="t5pf-ans-title">📷 纯视觉</span>
              <span className="t5pf-ans-trait">2D像素坐标 · 距离靠推算 · 受光照影响大</span>
            </div>
            <div className="t5pf-ans-card t5pf-ans-lidar">
              <span className="t5pf-ans-title">🔬 LiDAR</span>
              <span className="t5pf-ans-trait">3D空间坐标 · 厘米级精度 · 不依赖光照</span>
            </div>
          </div>
        </div>
        <div className="t5pf-right">
          {step >= 2 && (
            <div className="t5pf-fusion">
              <span className="t5pf-fusion-title">多传感器融合</span>
              <div className="t5pf-fusion-pair">
                <span>📷 摄像头 = 识别是什么</span>
                <span>🔬 LiDAR = 精确位置与轨迹</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t5pf-motto">
              <span className="t5pf-motto-text">传感器的物理缺陷 = 训练师的战场</span>
              <span className="t5pf-motto-sub">识别多少种缺陷 = 写出多少条规则 = 专业壁垒有多高</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
