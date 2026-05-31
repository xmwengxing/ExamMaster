import type { ChapterStepProps } from "../../registry/types";
import "./NotPhoto.css";

export default function NotPhoto({ step }: ChapterStepProps) {
  return (
    <div className="t5np-root scene-pad">
      <div className="t5np-layout">
        <div className="t5np-left">
          <div className="t5np-mistake">
            <span className="t5np-mistake-label">❌ 常见误解</span>
            <span className="t5np-mistake-text">点云 = 3D版的照片</span>
          </div>
          <div className="t5np-compare">
            <div className="t5np-card t5np-card-camera">
              <span className="t5np-card-title">📷 摄像头</span>
              <span className="t5np-card-principle">被动接收环境光</span>
              <span className="t5np-card-trait">光线越强·信息越完整</span>
            </div>
            <div className="t5np-card t5np-card-lidar">
              <span className="t5np-card-title">🔬 LiDAR</span>
              <span className="t5np-card-principle">主动发射激光·等反射</span>
              <span className="t5np-card-trait">激光弹开·就是一片空白</span>
            </div>
          </div>
        </div>
        <div className="t5np-right">
          {step >= 1 && (
            <div className="t5np-metaphor">
              <span className="t5np-meta-title">本质比喻</span>
              <span className="t5np-meta-text">摄像头 = 睁开眼睛看世界</span>
              <span className="t5np-meta-text">LiDAR = 黑暗中伸手指尖触摸</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5np-consequence">
              <span className="t5np-cons-text">不能用处理图像的思维处理点云</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5np-next">
              <span className="t5np-next-text">为什么有缺陷的LiDAR反而不可或缺？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
