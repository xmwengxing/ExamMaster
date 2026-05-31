import type { ChapterStepProps } from "../../registry/types";
import "./ConflictScene.css";

export default function ConflictScene({ step }: ChapterStepProps) {
  return (
    <div className="cs-root scene-pad">
      <div className="cs-center">
        {step <= 2 && (
          <div className="cs-intro">
            <span className="cs-course-tag">人工智能训练师 · 三级</span>
            <span className="cs-instructor">翁老师</span>
            {step >= 1 && <span className="cs-lesson-tag">第二节课 · 文本类业务数据处理</span>}
            {step >= 2 && (
              <div className="cs-insight">
                <span className="cs-insight-text">90%的精力追1%的准确率</span>
                <span className="cs-insight-vs">vs</span>
                <span className="cs-insight-text">忽视喂给模型的数据质量</span>
              </div>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="cs-conflict-stage">
            <div className={`cs-chat-row ${step >= 3 ? "cs-chat-on" : ""}`}>
              <div className="cs-bubble cs-bubble-left">
                <span className="cs-bubble-label">算法工程师</span>
                <span className="cs-bubble-text">这数据根本没法训，全是不相关的乱码和广告！</span>
              </div>
              <div className="cs-bubble cs-bubble-right">
                <span className="cs-bubble-label">业务方</span>
                <span className="cs-bubble-text">我们每天产生几万条真实客诉，你们算法不行怪数据？</span>
              </div>
            </div>
            {step >= 5 && (
              <div className="cs-tension">
                <div className="cs-tension-line" />
                <span className="cs-tension-label">算法 vs 业务 — 每天都在上演</span>
              </div>
            )}
          </div>
        )}
        {step >= 6 && (
          <div className="cs-bridge">
            <span className="cs-bridge-text">缺少一个关键角色 — 人工智能训练师</span>
          </div>
        )}
      </div>
    </div>
  );
}
