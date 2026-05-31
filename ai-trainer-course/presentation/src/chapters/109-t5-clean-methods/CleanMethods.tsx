import type { ChapterStepProps } from "../../registry/types";
import "./CleanMethods.css";

const METHODS = [
  { icon: "⏱", name: "时序滤波", desc: "利用时间稳定性 · 转瞬即逝必是噪点 · 多帧持续存在才是真实物体" },
  { icon: "📊", name: "反射率阈值", desc: "雨滴/雪花反射率极低 · 设置下限阈值快速过滤 · 注意黑色车辆误杀" },
];

export default function CleanMethods({ step }: ChapterStepProps) {
  return (
    <div className="t5cm-root scene-pad">
      <div className="t5cm-layout">
        <div className="t5cm-left">
          <span className="t5cm-title">清洗两大武器</span>
          <div className="t5cm-methods">
            {METHODS.map((m, i) => (
              <div key={m.name} className={`t5cm-method ${i <= step - 1 ? "t5cm-method-on" : "t5cm-method-off"}`}>
                <span className="t5cm-method-icon">{m.icon}</span>
                <div className="t5cm-method-body">
                  <span className="t5cm-method-name">{m.name}</span>
                  <span className="t5cm-method-desc">{m.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t5cm-right">
          {step >= 2 && (
            <div className="t5cm-best">
              <span className="t5cm-best-title">最佳实践</span>
              <span className="t5cm-best-text">时序滤波初筛 + 反射率阈值补刀</span>
              <span className="t5cm-best-note">互为备份 · 不漏噪点 · 不误杀真实物体</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5cm-sop">
              <span className="t5cm-sop-text">SOP中写明：几帧判定 + 多少阈值</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
