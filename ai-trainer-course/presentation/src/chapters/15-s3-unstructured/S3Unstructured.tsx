import type { ChapterStepProps } from "../../registry/types";
import "./S3Unstructured.css";

export default function S3Unstructured({ step }: ChapterStepProps) {
  return (
    <div className="s3u-root scene-pad">
      <div className="s3u-center">
        <div className="s3u-header">
          <span className="s3u-badge">大模型主粮</span>
          <span className="s3u-title">非结构化数据</span>
        </div>
        <div className="s3u-examples">
          <div className={`s3u-card ${step >= 0 ? "s3u-card-on" : ""}`}>
            <span className="s3u-card-icon">🎙</span><span className="s3u-card-text">客服录音</span>
          </div>
          <div className={`s3u-card ${step >= 1 ? "s3u-card-on" : ""}`}>
            <span className="s3u-card-icon">📝</span><span className="s3u-card-text">长文本评价</span>
          </div>
          <div className={`s3u-card ${step >= 1 ? "s3u-card-on" : ""}`}>
            <span className="s3u-card-icon">📚</span><span className="s3u-card-text">知识库文档</span>
          </div>
          <div className={`s3u-card ${step >= 2 ? "s3u-card-on" : ""}`}>
            <span className="s3u-card-icon">🎥</span><span className="s3u-card-text">视频数据</span>
          </div>
        </div>
        {step >= 2 && (
          <div className="s3u-compare">
            <div className="s3u-comp-bar">
              <span className="s3u-comp-label">1亿条优质对话 → 可用模型</span>
              <div className="s3u-comp-track"><div className="s3u-comp-fill s3u-fill-full" /></div>
            </div>
            <div className="s3u-comp-bar">
              <span className="s3u-comp-label">100万条随机文本 → 不可用</span>
              <div className="s3u-comp-track"><div className="s3u-comp-fill s3u-fill-low" /></div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <span className="s3u-footer">这不是量变，是质变</span>
        )}
      </div>
    </div>
  );
}
