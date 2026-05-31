import type { ChapterStepProps } from "../../registry/types";
import "./CallcenterDisaster.css";

export default function CallcenterDisaster({ step }: ChapterStepProps) {
  return (
    <div className="t4cd-root scene-pad">
      <div className="t4cd-layout">
        <div className="t4cd-left">
          <div className="t4cd-intro">
            <span className="t4cd-tag">人工智能训练师 · 三级</span>
            <span className="t4cd-instructor">翁老师</span>
            {step >= 1 && <span className="t4cd-lesson">第四节课 · 语音类业务数据处理</span>}
          </div>
          {step >= 2 && (
            <div className="t4cd-audio-card">
              <span className="t4cd-audio-icon">🎙️</span>
              <span className="t4cd-audio-hint">请佩戴耳机收听</span>
              <div className="t4cd-audio-wave">
                <div className="t4cd-wave-bar" style={{height:32}}/>
                <div className="t4cd-wave-bar" style={{height:56}}/>
                <div className="t4cd-wave-bar" style={{height:24}}/>
                <div className="t4cd-wave-bar" style={{height:70}}/>
                <div className="t4cd-wave-bar" style={{height:40}}/>
                <div className="t4cd-wave-bar" style={{height:60}}/>
                <div className="t4cd-wave-bar" style={{height:28}}/>
              </div>
              <span className="t4cd-audio-label">电商客服录音 · 方言+噪音+情绪</span>
            </div>
          )}
        </div>
        <div className="t4cd-right">
          {step >= 3 && (
            <div className="t4cd-noise-tags">
              <span className="t4cd-noise-title">录音中的干扰元素</span>
              <span className="t4cd-noise-tag">🐕 狗叫声</span>
              <span className="t4cd-noise-tag">💨 风吹麦克风</span>
              <span className="t4cd-noise-tag">👶 远处小孩叫喊</span>
              <span className="t4cd-noise-tag">🗣️ 浓重地方口音</span>
              <span className="t4cd-noise-tag">🤔 口吃与停顿</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t4cd-reality">
              <span className="t4cd-reality-text">真实世界的语音数据 — 录音棚不存在</span>
            </div>
          )}
          {step >= 5 && (
            <div className="t4cd-next">
              <span className="t4cd-next-text">这条录音丢给ASR引擎会怎样？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
