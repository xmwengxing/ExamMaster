import type { ChapterStepProps } from "../../registry/types";
import "./WaveformSpectrogram.css";

export default function WaveformSpectrogram({ step }: ChapterStepProps) {
  return (
    <div className="t4ws-root scene-pad">
      <div className="t4ws-layout">
        <div className="t4ws-left">
          <div className="t4ws-title">
            <span className="t4ws-main">给声音做CT</span>
            <span className="t4ws-sub">两个视觉化工具 + 一个判断口诀</span>
          </div>
          <div className="t4ws-tools">
            <div className={`t4ws-tool ${step >= 1 ? "t4ws-tool-on" : "t4ws-tool-off"}`}>
              <span className="t4ws-tool-name">波形图 Waveform</span>
              <span className="t4ws-tool-desc">横轴=时间 · 纵轴=振幅(响度)</span>
              <div className="t4ws-wave-demo">
                <div className="t4ws-wave-line"/>
              </div>
            </div>
            <div className={`t4ws-tool ${step >= 2 ? "t4ws-tool-on" : "t4ws-tool-off"}`}>
              <span className="t4ws-tool-name">语谱图 Spectrogram</span>
              <span className="t4ws-tool-desc">横轴=时间 · 纵轴=频率 · 颜色=能量</span>
              <div className="t4ws-spec-demo">
                <div className="t4ws-spec-bar" style={{height:20,width:40}}/>
                <div className="t4ws-spec-bar" style={{height:50,width:40}}/>
                <div className="t4ws-spec-bar" style={{height:30,width:40}}/>
                <div className="t4ws-spec-bar" style={{height:60,width:40}}/>
                <div className="t4ws-spec-bar" style={{height:15,width:40}}/>
                <div className="t4ws-spec-bar" style={{height:45,width:40}}/>
              </div>
            </div>
          </div>
        </div>
        <div className="t4ws-right">
          {step >= 3 && (
            <div className="t4ws-mantra">
              <span className="t4ws-mantra-title">判断口诀</span>
              <div className="t4ws-mantra-items">
                <span className="t4ws-mantra-item">📊 看波形图 → 判断何时说话、何时安静</span>
                <span className="t4ws-mantra-item">🌈 看语谱图 → 判断底噪、人声重叠</span>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="t4ws-next">
              <span className="t4ws-next-text">三大物理属性 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
