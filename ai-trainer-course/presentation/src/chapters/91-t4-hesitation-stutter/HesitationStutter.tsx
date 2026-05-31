import type { ChapterStepProps } from "../../registry/types";
import "./HesitationStutter.css";

export default function HesitationStutter({ step }: ChapterStepProps) {
  return (
    <div className="t4hs-root scene-pad">
      <div className="t4hs-layout">
        <div className="t4hs-left">
          <span className="t4hs-q-title">拷问一：语气词与口吃</span>
          <div className="t4hs-scenarios">
            <div className={`t4hs-scene ${step >= 1 ? "t4hs-scene-on" : "t4hs-scene-off"}`}>
              <span className="t4hs-scene-label">场景 A：意图识别</span>
              <div className="t4hs-scene-flow">
                <span className="t4hs-scene-text">我...嗯...那个...要退款</span>
                <span className="t4hs-scene-arrow">→</span>
                <span className="t4hs-scene-result">我要退款</span>
              </div>
              <span className="t4hs-scene-tag">语气词 = 废话 → 过滤</span>
            </div>
            <div className={`t4hs-scene t4hs-scene-alt ${step >= 2 ? "t4hs-scene-on" : "t4hs-scene-off"}`}>
              <span className="t4hs-scene-label">场景 B：犹豫度检测</span>
              <div className="t4hs-scene-flow">
                <span className="t4hs-scene-text">我...嗯...那个...要退款</span>
                <span className="t4hs-scene-arrow">→</span>
                <span className="t4hs-scene-result">我 &lt;hesitation&gt; 要退款</span>
              </div>
              <span className="t4hs-scene-tag t4hs-scene-tag-good">犹豫 = 核心信号 → 精细标注</span>
            </div>
          </div>
        </div>
        <div className="t4hs-right">
          {step >= 3 && (
            <div className="t4hs-stutter">
              <span className="t4hs-stutter-label">口吃处理</span>
              <div className="t4hs-stutter-demo">
                <span className="t4hs-stutter-wrong">❌ 标注员修正：我要退款</span>
                <span className="t4hs-stutter-right">✅ 真实保留：我/我/我要退款</span>
              </div>
              <span className="t4hs-stutter-note">禁止主观脑补 · 数据一致性至上</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t4hs-next">
              <span className="t4hs-next-text">拷问二：方言怎么处理？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
