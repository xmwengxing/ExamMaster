import type { ChapterStepProps } from "../../registry/types";
import "./Recap.css";

const MODULES = [
  { num: "01", title: "给声音做CT", key: "波形图/语谱图 + 三大物理属性严格对齐", icon: "🔬" },
  { num: "02", title: "VAD切片与重叠音", key: "WebRTC VAD + 语义切片+Overlap + 业务目标定义好坏", icon: "✂️" },
  { num: "03", title: "转写指南与声纹脱敏", key: "三拷问 + 方言疫苗 + 声纹指纹法律底线", icon: "📋" },
];

export default function Recap({ step }: ChapterStepProps) {
  return (
    <div className="t4r-root scene-pad">
      <div className="t4r-layout">
        <div className="t4r-left">
          <span className="t4r-title">全课复盘</span>
          <div className="t4r-modules">
            {MODULES.map((m, i) => (
              <div key={m.num} className={`t4r-mod ${i <= step - 1 ? "t4r-mod-on" : "t4r-mod-off"}`}>
                <span className="t4r-mod-num">{m.num}</span>
                <span className="t4r-mod-icon">{m.icon}</span>
                <div className="t4r-mod-body">
                  <span className="t4r-mod-title">{m.title}</span>
                  <span className="t4r-mod-key">{m.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t4r-right">
          {step >= 3 && (
            <div className="t4r-verdict">
              <span className="t4r-verdict-text">看懂声音 → 切准声音 → 写好规则</span>
              <span className="t4r-verdict-sub">语音训练师的完整能力闭环</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
