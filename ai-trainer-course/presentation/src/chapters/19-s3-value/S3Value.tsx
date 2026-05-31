import type { ChapterStepProps } from "../../registry/types";
import "./S3Value.css";

export default function S3Value({ step }: ChapterStepProps) {
  return (
    <div className="s3v-root scene-pad">
      <div className="s3v-center">
        <span className="s3v-question">你的核心价值是什么？</span>
        <div className="s3v-stack">
          {step >= 0 && <span className="s3v-strike">不是模型跑得有多准</span>}
          {step >= 0 && <span className="s3v-strike s3v-strike2">不是标注速度有多快</span>}
          {step >= 1 && (
            <div className="s3v-true">
              <span className="s3v-true-label">而是</span>
              <span className="s3v-true-line">在最早阶段</span>
              <span className="s3v-true-line">揪出数据孤岛</span>
            </div>
          )}
        </div>
        {step >= 2 && (
          <div className="s3v-motto">
            <span className="s3v-motto-line">不要等刀架在脖子上</span>
            {step >= 3 && <span className="s3v-motto-line s3v-motto-accent">才发现没米下锅</span>}
          </div>
        )}
      </div>
    </div>
  );
}
