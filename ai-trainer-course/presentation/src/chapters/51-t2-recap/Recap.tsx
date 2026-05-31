import type { ChapterStepProps } from "../../registry/types";
import "./Recap.css";

const MODULES = [
  { num: "01", title: "五步流水线", key: "合规优先 — 脱敏是红线", icon: "🔄" },
  { num: "02", title: "车机实战案例", key: "三刀手术法 — 去噪·脱敏·拆分", icon: "🚗" },
  { num: "03", title: "语义歧义攻克", key: "标注指南 + Golden Samples", icon: "📝" },
  { num: "04", title: "不可替代性", key: "模糊需求 → 精确规则", icon: "⭐" },
];

export default function Recap({ step }: ChapterStepProps) {
  return (
    <div className="rcp-root scene-pad">
      <div className="rcp-layout">
        <div className="rcp-left">
          <span className="rcp-title">本课复盘</span>
          <div className="rcp-modules">
            {MODULES.map((m, i) => (
              <div key={m.num} className={`rcp-mod ${i <= step - 1 ? "rcp-mod-on" : "rcp-mod-off"}`}>
                <span className="rcp-mod-num">{m.num}</span>
                <span className="rcp-mod-icon">{m.icon}</span>
                <div className="rcp-mod-body">
                  <span className="rcp-mod-title">{m.title}</span>
                  <span className="rcp-mod-key">{m.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rcp-right">
          {step >= 0 && <span className="rcp-phase-label">核心能力矩阵</span>}
          {step >= 3 && (
            <div className="rcp-verdict">
              <span className="rcp-verdict-text">数据处理 → 规则制定 → 质量把关</span>
              <span className="rcp-verdict-sub">三级训练师的完整能力闭环</span>
            </div>
          )}
          {step >= 4 && (
            <div className="rcp-next">
              <span className="rcp-next-text">检验学习成果 → 随堂测验</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
