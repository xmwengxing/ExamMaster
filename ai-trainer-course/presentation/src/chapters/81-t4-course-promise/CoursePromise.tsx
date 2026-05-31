import type { ChapterStepProps } from "../../registry/types";
import "./CoursePromise.css";

const ABILITIES = [
  { icon: "👁", title: "看懂声音", desc: "读波形图/语谱图 · 判断规格是否合格" },
  { icon: "✂️", title: "切准声音", desc: "VAD切除静音 · 语义级切片" },
  { icon: "📋", title: "写好规则", desc: "语气词/口吃/方言/重叠音转写指南" },
];

export default function CoursePromise({ step }: ChapterStepProps) {
  return (
    <div className="t4cp-root scene-pad">
      <div className="t4cp-layout">
        <div className="t4cp-left">
          <div className="t4cp-title">
            <span className="t4cp-main">三项核心能力</span>
            <span className="t4cp-sub">语音训练师与普通标注员的分界线</span>
          </div>
          <div className="t4cp-abilities">
            {ABILITIES.map((a, i) => (
              <div key={a.title} className={`t4cp-ab ${i <= step - 1 ? "t4cp-ab-on" : "t4cp-ab-off"}`}>
                <span className="t4cp-ab-icon">{a.icon}</span>
                <div className="t4cp-ab-body">
                  <span className="t4cp-ab-title">{a.title}</span>
                  <span className="t4cp-ab-desc">{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t4cp-right">
          {step >= 2 && (
            <div className="t4cp-start">
              <span className="t4cp-start-text">S2：给声音做CT →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
