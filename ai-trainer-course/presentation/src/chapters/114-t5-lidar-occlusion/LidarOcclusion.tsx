import type { ChapterStepProps } from "../../registry/types";
import "./LidarOcclusion.css";

export default function LidarOcclusion({ step }: ChapterStepProps) {
  return (
    <div className="t5lo-root scene-pad">
      <div className="t5lo-layout">
        <h2 className="t5lo-title">虚拟3D框 + LiDAR_Occlusion标签</h2>

        <div className="t5lo-steps">
          <div className={`t5lo-step ${step >= 1 ? "t5lo-step--on" : ""}`}>
            <div className="t5lo-step-num">1</div>
            <div className="t5lo-step-body">
              <span className="t5lo-step-label">依托图像2D边界</span>
              <span className="t5lo-step-desc">在图像上精确标出目标边界框</span>
            </div>
          </div>

          <div className={`t5lo-step ${step >= 2 ? "t5lo-step--on" : ""}`}>
            <div className="t5lo-step-num">2</div>
            <div className="t5lo-step-body">
              <span className="t5lo-step-label">结合前后帧点云轨迹</span>
              <span className="t5lo-step-desc">时序连贯性推断当前位置</span>
            </div>
          </div>

          <div className={`t5lo-step ${step >= 3 ? "t5lo-step--on" : ""}`}>
            <div className="t5lo-step-num">3</div>
            <div className="t5lo-step-body">
              <span className="t5lo-step-label">绘制虚拟3D框</span>
              <span className="t5lo-step-desc">在推断位置上手动创建</span>
            </div>
          </div>

          <div className={`t5lo-step ${step >= 4 ? "t5lo-step--on" : ""}`}>
            <div className="t5lo-step-num">4</div>
            <div className="t5lo-step-body">
              <span className="t5lo-step-label">打上 LiDAR_Occlusion 标签</span>
              <span className="t5lo-step-desc">特殊标签告诉算法：目标存在但雷达失效</span>
            </div>
          </div>
        </div>

        {step >= 4 && (
          <div className="t5lo-tag-demo">
            <span className="t5lo-tag-bracket">&lt;</span>
            <span className="t5lo-tag-name">LiDAR_Occlusion</span>
            <span className="t5lo-tag-bracket">/&gt;</span>
            <span className="t5lo-tag-meaning">= 雷达遮挡/失效的知情标签</span>
          </div>
        )}
      </div>
    </div>
  );
}