import type { ChapterStepProps } from "../../registry/types";
import "./SwordKeyframe.css";

export default function SwordKeyframe({ step }: ChapterStepProps) {
  return (
    <div className="t3sk-root scene-pad">
      <div className="t3sk-layout">
        <div className="t3sk-left">
          <div className="t3sk-header">
            <span className="t3sk-num">第二剑</span>
            <span className="t3sk-name">I帧提取</span>
            <span className="t3sk-sub">利用视频编码的天然特性</span>
          </div>
          <div className="t3sk-mechanism">
            <span className="t3sk-mech-title">视频压缩原理</span>
            <div className="t3sk-mech-frames">
              <div className="t3sk-frame t3sk-frame-i"><span>I帧</span><small>完整画面</small></div>
              <span className="t3sk-frame-arrow">→</span>
              <div className="t3sk-frame t3sk-frame-p"><span>P帧</span><small>差异帧</small></div>
              <span className="t3sk-frame-arrow">→</span>
              <div className="t3sk-frame t3sk-frame-p"><span>B帧</span><small>双向差异</small></div>
              <span className="t3sk-frame-arrow">→</span>
              <div className="t3sk-frame t3sk-frame-i"><span>I帧</span><small>基准帧</small></div>
            </div>
          </div>
        </div>
        <div className="t3sk-right">
          {step >= 0 && (
            <div className="t3sk-advantage">
              <span className="t3sk-adv-title">优势</span>
              <span className="t3sk-adv-item">⚡ 无需重新解码</span>
              <span className="t3sk-adv-item">📦 直接提取完整图片</span>
              <span className="t3sk-adv-item">💨 速度极快</span>
            </div>
          )}
          {step >= 1 && (
            <div className="t3sk-limitation">
              <span className="t3sk-lim-title">局限</span>
              <span className="t3sk-lim-item">每2~5秒才1个I帧</span>
              <span className="t3sk-lim-item">无法精确控制位置和密度</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3sk-suitable">
              <span className="t3sk-suit-label">✅ 适用场景</span>
              <span className="t3sk-suit-text">商场客流量统计 · 宏观聚合分析</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3sk-suit-not">
              <span className="t3sk-suit-label">❌ 不适用</span>
              <span className="t3sk-suit-text">安防事件追溯 · 需要精确到秒的目标识别</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
