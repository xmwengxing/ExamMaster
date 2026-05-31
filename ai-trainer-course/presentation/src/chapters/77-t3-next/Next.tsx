import type { ChapterStepProps } from "../../registry/types";
import "./Next.css";

export default function Next({ step }: ChapterStepProps) {
  return (
    <div className="t3nx-root scene-pad">
      <div className="t3nx-layout">
        <div className="t3nx-left">
          <div className="t3nx-preview">
            <span className="t3nx-preview-label">下节课预告</span>
            <span className="t3nx-next-name">语音类业务数据处理</span>
            <span className="t3nx-next-tag">Section 1.4</span>
            <div className="t3nx-topics">
              <span className="t3nx-topic">🎙 语音降噪与分割</span>
              <span className="t3nx-topic">🔒 声纹脱敏</span>
              <span className="t3nx-topic">📝 音素对齐与情绪标注</span>
            </div>
          </div>
        </div>
        <div className="t3nx-right">
          {step >= 1 && (
            <div className="t3nx-method">
              <span className="t3nx-method-text">从操作到策略 · 从执行到架构</span>
              <span className="t3nx-method-sub">训练师的不可替代性，每一步都在提升</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3nx-farewell">
              <span className="t3nx-farewell-name">翁老师</span>
              <span className="t3nx-farewell-text">下节课见</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
