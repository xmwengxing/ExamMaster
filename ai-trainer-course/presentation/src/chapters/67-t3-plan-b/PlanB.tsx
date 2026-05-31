import type { ChapterStepProps } from "../../registry/types";
import "./PlanB.css";

export default function PlanB({ step }: ChapterStepProps) {
  return (
    <div className="t3pb2-root scene-pad">
      <div className="t3pb2-layout">
        <div className="t3pb2-left">
          <div className="t3pb2-header">
            <span className="t3pb2-label">方案 B</span>
            <span className="t3pb2-name">事件触发 + 动态抽帧</span>
            <span className="t3pb2-sub">区域入侵检测 → 5FPS 触发记录</span>
          </div>
          <div className="t3pb2-calc">
            <span className="t3pb2-calc-title">新算账</span>
            <div className="t3pb2-calc-steps">
              <div className="t3pb2-calc-step">
                <span className="t3pb2-calc-op">48路 × 5FPS × 2.5h</span>
                <span className="t3pb2-calc-eq">=</span>
                <span className="t3pb2-calc-num t3pb2-calc-green">216万帧/天</span>
              </div>
              <div className="t3pb2-calc-step">
                <span className="t3pb2-calc-op">216万 × ¥0.2</span>
                <span className="t3pb2-calc-eq">=</span>
                <span className="t3pb2-calc-num">¥43万/天</span>
              </div>
              <div className="t3pb2-calc-step">
                <span className="t3pb2-calc-op">+ 预标注 ¥0.02</span>
                <span className="t3pb2-calc-eq">=</span>
                <span className="t3pb2-calc-num t3pb2-calc-big">¥4.3万/天</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3pb2-right">
          {step >= 0 && (
            <div className="t3pb2-trigger">
              <span className="t3pb2-trig-title">前置触发器</span>
              <div className="t3pb2-trig-flow">
                <span className="t3pb2-trig-step">人员进入区域 →</span>
                <span className="t3pb2-trig-step">系统激活 5FPS →</span>
                <span className="t3pb2-trig-step">离开后停止</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t3pb2-quality">
              <span className="t3pb2-qual-title">100%有效帧</span>
              <span className="t3pb2-qual-desc">每张都包含人员目标，零浪费</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t3pb2-motto">
              <span className="t3pb2-motto-text">之前那些事根本不需要做</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
