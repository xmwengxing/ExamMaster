import type { ChapterStepProps } from "../../registry/types";
import "./S2BankCase.css";

const STAGES = ["触发", "数据", "推理", "集成", "迭代"];
const DETAILS = [
  { idx: "1", text: "凌晨筛选逾期名单", role: "触发" },
  { idx: "2", text: "调取客户画像与征信标签", role: "数据" },
  { idx: "3", text: "AI 预测还款意愿", role: "推理" },
  { idx: "4", text: "高意愿发短信 / 低意愿转人工+话术", role: "集成" },
  { idx: "5", text: "还款结果作为标签回流", role: "迭代" },
];

export default function S2BankCase({ step }: ChapterStepProps) {
  return (
    <div className="bc-root scene-pad">
      <div className="bc-center">
        <span className="bc-title">银行智能催收系统</span>
        <div className="bc-pipeline">
          {STAGES.map((s, i) => (
            <div key={s} className="bc-pipe-group">
              <div className={`bc-pipe-node ${step >= i ? "bc-pipe-lit" : "bc-pipe-dim"}`}>
                <span className="bc-pipe-num">{i + 1}</span>
                <span className="bc-pipe-label">{s}</span>
              </div>
              {i < STAGES.length - 1 && (
                <svg className="bc-arrow" width="36" height="12" viewBox="0 0 36 12">
                  <line x1="0" y1="6" x2="30" y2="6" stroke="var(--rule)" strokeWidth="2" />
                  <polygon points="31,1 36,6 31,11" fill="var(--rule)" />
                </svg>
              )}
            </div>
          ))}
        </div>
        {step >= 5 && (
          <div className="bc-details">
            {DETAILS.map((d, i) => (
              <div key={i} className={`bc-detail-row ${i <= step - 5 ? "bc-detail-on" : ""}`}>
                <span className="bc-detail-idx">{d.idx}</span>
                <span className="bc-detail-text">{d.text}</span>
                <span className={`bc-detail-role ${d.role === "触发" || d.role === "推理" ? "bc-role-accent" : ""}`}>{d.role}</span>
              </div>
            ))}
          </div>
        )}
        {step >= 6 && (
          <span className="bc-closing">AI 是镶嵌在业务流程中的智能阀门</span>
        )}
      </div>
    </div>
  );
}
