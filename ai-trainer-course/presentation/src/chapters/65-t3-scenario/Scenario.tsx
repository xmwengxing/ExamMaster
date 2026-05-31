import type { ChapterStepProps } from "../../registry/types";
import "./Scenario.css";

export default function Scenario({ step }: ChapterStepProps) {
  return (
    <div className="t3sc-root scene-pad">
      <div className="t3sc-layout">
        <div className="t3sc-left">
          <div className="t3sc-brief">
            <span className="t3sc-brief-label">项目概况</span>
            <span className="t3sc-brief-title">工地未戴安全帽自动检测</span>
            <div className="t3sc-brief-items">
              <span className="t3sc-brief-item">240路高清摄像头</span>
              <span className="t3sc-brief-item">30个在建工地</span>
              <span className="t3sc-brief-item">每天10小时施工</span>
            </div>
          </div>
        </div>
        <div className="t3sc-right">
          {step >= 0 && (
            <div className="t3sc-question">
              <span className="t3sc-q-text">训练师的第一件事：设计数据策略</span>
              <div className="t3sc-q-list">
                <span className="t3sc-q-item">每天要处理多少数据？</span>
                <span className="t3sc-q-item">有多少是有用的？</span>
                <span className="t3sc-q-item">如何控制数据量在合理范围？</span>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="t3sc-tease">
              <span className="t3sc-tease-warn">⚠️ 80%的初级训练师会选的方案</span>
              <span className="t3sc-tease-label">方案A：全量均匀抽帧 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
