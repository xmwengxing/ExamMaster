import type { ChapterStepProps } from "../../registry/types";
import "./VoicePrivacy.css";

export default function VoicePrivacy({ step }: ChapterStepProps) {
  return (
    <div className="t4vp-root scene-pad">
      <div className="t4vp-layout">
        <div className="t4vp-left">
          <span className="t4vp-title">声纹隐私脱敏</span>
          <div className="t4vp-concept">
            <span className="t4vp-concept-label">声纹 = 声音指纹</span>
            <span className="t4vp-concept-desc">声带频率 · 口腔共鸣 · 语速语调 · 识别精度≈指纹</span>
          </div>
          <div className="t4vp-methods">
            <div className="t4vp-method">
              <span className="t4vp-method-name">声纹特征模糊</span>
              <span className="t4vp-method-desc">扰动声学参数 · 保留自然度</span>
            </div>
            <div className="t4vp-method">
              <span className="t4vp-method-name">语音合成替换</span>
              <span className="t4vp-method-desc">TTS重新合成 · 更安全但可能不自然</span>
            </div>
          </div>
        </div>
        <div className="t4vp-right">
          {step >= 2 && (
            <div className="t4vp-redline">
              <span className="t4vp-redline-icon">⛔</span>
              <span className="t4vp-redline-text">数据离手前，必须切断音频与真实身份关联</span>
              <span className="t4vp-redline-note">不是技术选项，是法律底线</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4vp-next">
              <span className="t4vp-next-text">S5：总结与通关任务 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
