import type { ChapterStepProps } from "../../registry/types";
import "./RookieMistake.css";

export default function RookieMistake({ step }: ChapterStepProps) {
  return (
    <div className="t3rk-root scene-pad">
      <div className="t3rk-layout">
        <div className="t3rk-left">
          <div className="t3rk-command">
            <span className="t3rk-cmd-label">初级训练师的第一反应</span>
            <div className="t3rk-cmd-box">
              <span className="t3rk-cmd-text">ffmpeg -i video.mp4 -r 30 frame_%d.jpg</span>
              <span className="t3rk-cmd-note">每秒30帧 · 不做任何策略判断</span>
            </div>
          </div>
          <div className="t3rk-reality">
            <span className="t3rk-reality-title">真实案例：自动驾驶项目</span>
            <div className="t3rk-reality-items">
              <span className="t3rk-reality-item">10 FPS × 3个月行车记录仪</span>
              <span className="t3rk-reality-item">标注团队标了2个月</span>
              <span className="t3rk-reality-item">7/10 帧标注框完全重叠</span>
              <span className="t3rk-reality-item t3rk-reality-red">额外增加 200万+ 预算</span>
            </div>
          </div>
        </div>
        <div className="t3rk-right">
          {step >= 1 && (
            <div className="t3rk-demo">
              <span className="t3rk-demo-label">10秒视频 × 30 FPS → 300张帧</span>
              <div className="t3rk-demo-bars">
                <div className="t3rk-demo-bar t3rk-bar-good"><span>有用 5帧</span></div>
                <div className="t3rk-demo-bar t3rk-bar-bad"><span>冗余 85帧</span></div>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="t3rk-lesson">
              <span className="t3rk-lesson-title">核心教训</span>
              <span className="t3rk-lesson-text">抽帧不是越快越好</span>
              <span className="t3rk-lesson-sub">策略必须在理解业务场景之后决定</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3rk-next">
              <span className="t3rk-next-text">抽帧三剑客 — 系统化方法论 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
