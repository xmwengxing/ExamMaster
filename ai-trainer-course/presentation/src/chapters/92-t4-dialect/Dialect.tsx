import type { ChapterStepProps } from "../../registry/types";
import "./Dialect.css";

export default function Dialect({ step }: ChapterStepProps) {
  return (
    <div className="t4di-root scene-pad">
      <div className="t4di-layout">
        <div className="t4di-left">
          <span className="t4di-title">拷问三：方言与口音</span>
          <div className={`t4di-fail ${step >= 0 ? "t4di-show" : ""}`}>
            <span className="t4di-fail-title">真实翻车案例</span>
            <span className="t4di-fail-desc">纯普通话TTS → 广东/四川试点 → 现场翻车</span>
            <span className="t4di-fail-reason">训练数据零方言 → 模型无法识别真实世界的口音</span>
          </div>
          {step >= 1 && (
            <div className="t4di-correct">
              <span className="t4di-correct-label">正确做法</span>
              <div className="t4di-correct-item">
                <span className="t4di-correct-word">咋整</span>
                <span className="t4di-correct-arrow">→</span>
                <span className="t4di-correct-fix">咋整 <span className="t4di-tag">&lt;dialect&gt;</span></span>
              </div>
              <span className="t4di-correct-note">如实记录 · 打标签 · 不翻译成普通话</span>
            </div>
          )}
        </div>
        <div className="t4di-right">
          {step >= 2 && (
            <div className="t4di-vaccine">
              <span className="t4di-vaccine-title">方言 = 模型的疫苗</span>
              <span className="t4di-vaccine-item">普通话数据 → 及格线</span>
              <span className="t4di-vaccine-item t4di-vaccine-highlight">方言数据 → 优秀线</span>
              <span className="t4di-vaccine-item">真实多变数据 → 鲁棒性</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4di-next">
              <span className="t4di-next-text">声纹隐私脱敏 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
