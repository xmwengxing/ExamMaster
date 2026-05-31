import type { ChapterStepProps } from "../../registry/types";
import "./MethodPromise.css";

const PILLARS = [
  { label: "文本清洗", sub: "规则设计" },
  { label: "数据脱敏", sub: "合规红线" },
  { label: "歧义处理", sub: "标注指南" },
];

export default function MethodPromise({ step }: ChapterStepProps) {
  return (
    <div className="mp-root scene-pad">
      <div className="mp-center">
        {step <= 2 && (
          <div className="mp-guarantee-stage">
            {step >= 0 && <span className="mp-guarantee-text">掌握了方法论，你的项目里不再有低级扯皮</span>}
            {step >= 1 && <span className="mp-guarantee-sub">在数据进入系统之前，你已经做好了第一轮质量把关</span>}
            {step >= 2 && (
              <div className="mp-focus">
                <span className="mp-focus-label">今天聚焦三大核心能力</span>
                <div className="mp-pillars">
                  {PILLARS.map((p, i) => (
                    <div key={p.label} className={`mp-pillar ${i <= step - 2 ? "mp-pillar-on" : "mp-pillar-off"}`}>
                      <span className="mp-pillar-label">{p.label}</span>
                      <span className="mp-pillar-sub">{p.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="mp-scenarios">
            <span className="mp-scenarios-title">解决的三个典型场景</span>
            <div className="mp-scenario-list">
              <div className="mp-scenario-item">
                <span className="mp-scenario-num">01</span>
                <span className="mp-scenario-text">拿到脏数据，不知道从哪下手清理</span>
              </div>
              <div className="mp-scenario-item">
                <span className="mp-scenario-num">02</span>
                <span className="mp-scenario-text">担心隐私泄露，不知道怎么规范处理</span>
              </div>
              <div className="mp-scenario-item">
                <span className="mp-scenario-num">03</span>
                <span className="mp-scenario-text">面对模棱两可的文本，不知道怎么给标注员规则</span>
              </div>
            </div>
          </div>
        )}
        {step >= 4 && (
          <div className="mp-industrial">
            <span className="mp-industrial-text">全部方案来源于真实的工业级项目经验</span>
          </div>
        )}
        {step >= 5 && (
          <div className="mp-ready">
            <span className="mp-ready-text">正式开讲</span>
            <div className="mp-dashed" />
            <span className="mp-section-tag">Section 1.2 · 五步流水线</span>
          </div>
        )}
      </div>
    </div>
  );
}
