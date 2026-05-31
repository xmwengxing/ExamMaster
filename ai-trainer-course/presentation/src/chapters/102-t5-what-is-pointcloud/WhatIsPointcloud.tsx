import type { ChapterStepProps } from "../../registry/types";
import "./WhatIsPointcloud.css";

export default function WhatIsPointcloud({ step }: ChapterStepProps) {
  return (
    <div className="t5wp-root scene-pad">
      <div className="t5wp-layout">
        <div className="t5wp-left">
          <div className="t5wp-title">
            <span className="t5wp-main">什么是点云</span>
            <span className="t5wp-sub">Point Cloud = 百万束激光的空间采样</span>
          </div>
          <div className="t5wp-diagram">
            <div className="t5wp-lidar-icon">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" opacity=".5"/>
                <circle cx="60" cy="60" r="8" fill="var(--accent)"/>
                {[0,45,90,135,180,225,270,315].map((a, i) => (
                  <line key={i} x1="60" y1="60" x2={60+45*Math.cos(a*Math.PI/180)} y2={60+45*Math.sin(a*Math.PI/180)} stroke="var(--accent)" strokeWidth="1.5" opacity=".6"/>
                ))}
              </svg>
              <span className="t5wp-lidar-label">LiDAR 扫描</span>
            </div>
            <div className="t5wp-formula">
              <span className="t5wp-formula-text">每束激光 → 飞行时间 → X·Y·Z 坐标</span>
              <span className="t5wp-formula-tag">100万点/秒</span>
            </div>
          </div>
        </div>
        <div className="t5wp-right">
          {step >= 1 && (
            <div className="t5wp-compare">
              <div className="t5wp-compare-item t5wp-compare-3d">
                <span className="t5wp-compare-label">3D 模型</span>
                <span className="t5wp-compare-trait">三角面片 · 连续表面 · 完整外壳</span>
              </div>
              <div className="t5wp-compare-item t5wp-compare-pc">
                <span className="t5wp-compare-label">点云</span>
                <span className="t5wp-compare-trait">离散采样 · 无连线 · 锯齿状边缘</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t5wp-insight">
              <span className="t5wp-insight-text">关键不在多少点，在空间分布——密度高/稀疏</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t5wp-next">
              <span className="t5wp-next-text">第四维：反射率 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
