import type { ChapterStepProps } from "../../registry/types";
import "./Sop.css";

const MODULES = [
  { num: "01", title: "采样率规范", desc: "确定采样率/声道/位深 + 与下游模型对齐" },
  { num: "02", title: "方言与口吃转写规则", desc: "保留真实发音+打标签 + ≥2条标准示例" },
  { num: "03", title: "隐私脱敏策略", desc: "声纹脱敏方案 + 文本PII处理方案" },
];

export default function Sop({ step }: ChapterStepProps) {
  return (
    <div className="t4sp-root scene-pad">
      <div className="t4sp-layout">
        <div className="t4sp-left">
          <span className="t4sp-title">通关考核 · SOP模板</span>
          <div className="t4sp-doc">
            <span className="t4sp-doc-name">📄 语音数据处理与转写SOP</span>
            <span className="t4sp-scenario">场景：面向老年人的智能医疗问诊语音助手</span>
            <div className="t4sp-sections">
              {MODULES.map((m, i) => (
                <div key={m.num} className={`t4sp-sec ${i <= step - 1 ? "t4sp-sec-on" : "t4sp-sec-off"}`}>
                  <span className="t4sp-sec-num">{m.num}</span>
                  <div className="t4sp-sec-body">
                    <span className="t4sp-sec-title">{m.title}</span>
                    <span className="t4sp-sec-desc">{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="t4sp-right">
          {step >= 0 && (
            <div className="t4sp-criteria">
              <span className="t4sp-cr-title">评审标准</span>
              <span className="t4sp-cr-item">1. 技术规格与模型严格对齐</span>
              <span className="t4sp-cr-item">2. 标注规则具体到标注员可执行</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
