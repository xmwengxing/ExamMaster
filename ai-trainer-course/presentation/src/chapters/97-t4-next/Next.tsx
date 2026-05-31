import type { ChapterStepProps } from "../../registry/types";
import "./Next.css";

export default function Next({ step }: ChapterStepProps) {
  return (
    <div className="t4nx-root scene-pad">
      <div className="t4nx-layout">
        <div className="t4nx-left">
          <div className="t4nx-preview">
            <span className="t4nx-preview-label">下节课预告</span>
            <span className="t4nx-next-name">点云类业务数据处理</span>
            <span className="t4nx-next-tag">Section 1.5</span>
            <div className="t4nx-topics">
              <span className="t4nx-topic">📐 三维坐标点云</span>
              <span className="t4nx-topic">🚗 LiDAR激光雷达数据</span>
              <span className="t4nx-topic">🏷️ XYZ+反射率标注</span>
            </div>
          </div>
        </div>
        <div className="t4nx-right">
          {step >= 1 && (
            <div className="t4nx-method">
              <span className="t4nx-method-text">文本 → 视频 → 语音</span>
              <span className="t4nx-method-sub">三大数据模态武器已掌握。下一站：三维物理世界</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4nx-farewell">
              <span className="t4nx-farewell-name">翁老师</span>
              <span className="t4nx-farewell-text">我们下节课见</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
