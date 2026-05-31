import type { ChapterStepProps } from "../../registry/types";
import "./BladeNoise.css";

export default function BladeNoise({ step }: ChapterStepProps) {
  return (
    <div className="bn-root scene-pad">
      <div className="bn-layout">
        <div className="bn-left">
          <div className="bn-knife-header">
            <span className="bn-knife-num">第一刀</span>
            <span className="bn-knife-name">去噪</span>
          </div>
          <div className="bn-log-view">
            <div className="bn-log-row">
              <span className="bn-log-op">✂️</span>
              <span className={`bn-log-tag ${step >= 1 ? "bn-strikethrough" : ""}`}>{"<br>"}</span>
              <span className="bn-log-reason">HTML标签残留 → 删除</span>
            </div>
            <div className="bn-log-row bn-log-note">
              <span className="bn-log-op">✂️</span>
              <span className={`bn-log-tag ${step >= 2 ? "bn-strikethrough" : ""}`}>...噪音...</span>
              <span className="bn-log-reason">风声误识别 → 过滤</span>
            </div>
          </div>
          {step >= 3 && (
            <div className="bn-after">
              <span className="bn-after-label">去噪后</span>
              <div className="bn-after-box">
                <span className="bn-after-text">[2026-05-26] User: 帮我导航到 138xxxx5678 那个老王家开的超市，顺便放点 #导航失败#</span>
              </div>
            </div>
          )}
        </div>
        <div className="bn-right">
          {step >= 0 && (
            <div className="bn-principle">
              <span className="bn-principle-title">去噪原则</span>
              <span className="bn-principle-text">砍掉所有不属于有效文本内容的格式化残留和识别错误</span>
            </div>
          )}
          {step >= 3 && (
            <div className="bn-insight">
              <span className="bn-insight-title">💡 训练师的核心判断力</span>
              <span className="bn-insight-text">了解语音识别在高速行驶场景下的常见错误模式，才能判断什么是噪音、什么是真实输入。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
