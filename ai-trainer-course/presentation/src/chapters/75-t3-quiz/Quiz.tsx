import type { ChapterStepProps } from "../../registry/types";
import "./Quiz.css";

export default function Quiz({ step }: ChapterStepProps) {
  return (
    <div className="t3qz-root scene-pad">
      <div className="t3qz-layout">
        <div className="t3qz-header">
          <span className="t3qz-title">随堂检测 · 抽帧策略选择</span>
        </div>
        <div className="t3qz-questions">
          <div className={`t3qz-q ${step >= 1 ? "t3qz-q-on" : "t3qz-q-off"}`}>
            <span className="t3qz-q-num">Q1</span>
            <div className="t3qz-q-body">
              <span className="t3qz-q-text">流水线质检，产品匀速经过镜头，最适合的抽帧策略？</span>
              <div className="t3qz-q-opts">
                <span className="t3qz-opt t3qz-opt-right">A. 均匀抽帧 ✓</span>
                <span className="t3qz-opt">B. I帧提取</span>
                <span className="t3qz-opt">C. 事件触发</span>
              </div>
            </div>
          </div>
          <div className={`t3qz-q ${step >= 2 ? "t3qz-q-on" : "t3qz-q-off"}`}>
            <span className="t3qz-q-num">Q2</span>
            <div className="t3qz-q-body">
              <span className="t3qz-q-text">商场客流量统计，不要求精确轨迹，最经济高效的策略？</span>
              <div className="t3qz-q-opts">
                <span className="t3qz-opt">A. 均匀抽帧</span>
                <span className="t3qz-opt t3qz-opt-right">B. I帧提取 ✓</span>
                <span className="t3qz-opt">C. 事件触发</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
