import type { ChapterStepProps } from "../../registry/types";
import "./Occlusion.css";

export default function Occlusion({ step }: ChapterStepProps) {
  return (
    <div className="t5oc-root scene-pad">
      <div className="t5oc-layout">
        <div className="t5oc-left">
          <div className="t5oc-header">
            <span className="t5oc-num">盲区 02</span>
            <span className="t5oc-name">遮挡与透视无能</span>
          </div>
          <div className="t5oc-demo">
            <div className="t5oc-comparison">
              <div className="t5oc-comp t5oc-comp-camera">
                <span className="t5oc-comp-label">📷 摄像头</span>
                <span className="t5oc-comp-text">挡风玻璃 → 透明 → 看到车内</span>
              </div>
              <div className="t5oc-comp t5oc-comp-lidar">
                <span className="t5oc-comp-label">🔬 LiDAR</span>
                <span className="t5oc-comp-text">挡风玻璃 → 空洞 → 看到座椅点</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t5oc-right">
          {step >= 1 && (
            <div className="t5oc-phenomenon">
              <span className="t5oc-phen-title">点云中的车窗</span>
              <span className="t5oc-phen-desc">一个挡风玻璃形状的透明黑洞</span>
              <span className="t5oc-phen-note">透过空洞 → 车内座椅的点云直接暴露</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5oc-rule">
              <span className="t5oc-rule-text">标注指南必须为玻璃遮挡场景制定专门处理规则</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
