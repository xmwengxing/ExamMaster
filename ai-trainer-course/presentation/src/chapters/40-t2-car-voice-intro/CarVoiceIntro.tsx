import type { ChapterStepProps } from "../../registry/types";
import "./CarVoiceIntro.css";

export default function CarVoiceIntro({ step }: ChapterStepProps) {
  return (
    <div className="cvi-root scene-pad">
      <div className="cvi-layout">
        <div className="cvi-left">
          {step >= 0 && <span className="cvi-label">真实案例</span>}
          {step >= 1 && (
            <div className="cvi-project-card">
              <span className="cvi-project-icon">🚗</span>
              <span className="cvi-project-name">新能源车企</span>
              <span className="cvi-project-role">语音助手意图识别</span>
              <span className="cvi-project-tag">你的第一个项目</span>
            </div>
          )}
          {step >= 2 && (
            <div className="cvi-data-source">
              <span className="cvi-source-label">数据来源</span>
              <div className="cvi-source-items">
                <span className="cvi-source-item">🗣️ 车载语音日志</span>
                <span className="cvi-source-item">📋 系统记录文本</span>
                <span className="cvi-source-item">📊 日均数千条指令</span>
              </div>
            </div>
          )}
        </div>
        <div className="cvi-right">
          {step >= 3 && (
            <div className="cvi-challenges">
              <span className="cvi-challenge-title">原始数据特征</span>
              <div className="cvi-challenge-list">
                <span className="cvi-challenge-item">HTML 格式标签残留</span>
                <span className="cvi-challenge-item">环境噪音误识别文本</span>
                <span className="cvi-challenge-item">用户无意识泄露 PII</span>
                <span className="cvi-challenge-item">多个意图混杂</span>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="cvi-teaser">
              <span className="cvi-teaser-text">直接看这条日志有多脏 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
