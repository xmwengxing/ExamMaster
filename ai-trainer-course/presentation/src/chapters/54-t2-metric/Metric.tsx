import type { ChapterStepProps } from "../../registry/types";
import "./Metric.css";

const LEVELS = [
  { num: "L1", label: "反应层", desc: "完播率 · 弹题正确率", icon: "📺", show: 0 },
  { num: "L2", label: "学习层", desc: "SOP文档 · 结果性评价", icon: "📝", show: 0 },
  { num: "L3", label: "行为层", desc: "工作实践 · 主管打分", icon: "👔", show: 2 },
  { num: "L4", label: "结果层", desc: "Bad Case下降率", icon: "📉", show: 2 },
];

export default function Metric({ step }: ChapterStepProps) {
  return (
    <div className="mtc-root scene-pad">
      <div className="mtc-layout">
        <div className="mtc-left">
          <div className="mtc-model">
            <span className="mtc-model-title">柯氏四级评估</span>
            <div className="mtc-levels">
              {LEVELS.map((lv) => (
                <div key={lv.num} className={`mtc-level ${step >= lv.show ? "mtc-level-on" : "mtc-level-off"}`}>
                  <span className="mtc-level-num">{lv.num}</span>
                  <span className="mtc-level-icon">{lv.icon}</span>
                  <div className="mtc-level-body">
                    <span className="mtc-level-label">{lv.label}</span>
                    <span className="mtc-level-desc">{lv.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mtc-right">
          {step >= 3 && (
            <div className="mtc-motto">
              <span className="mtc-motto-quote">得高质量文本者得天下</span>
              <span className="mtc-motto-roles">
                <span className="mtc-role">💡 数据质量守门员</span>
                <span className="mtc-role-tag">行业最稀缺的人才</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
