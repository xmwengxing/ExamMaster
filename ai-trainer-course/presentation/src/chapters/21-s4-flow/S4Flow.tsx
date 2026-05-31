import type { ChapterStepProps } from "../../registry/types";
import "./S4Flow.css";

const NODES = ["顾客扫码", "AI 推荐菜品", "顾客下单", "后厨做菜", "顾客结账"];

export default function S4Flow({ step }: ChapterStepProps) {
  return (
    <div className="s4f-root scene-pad">
      <div className="s4f-center">
        <span className="s4f-label">初级产品经理流程图</span>
        <div className="s4f-pipeline">
          {NODES.map((n, i) => (
            <div key={n} className="s4f-pipe-group">
              <div className={`s4f-node ${step >= i ? "s4f-node-on" : "s4f-node-off"}`}>
                <span className="s4f-node-num">{i + 1}</span>
                <span className="s4f-node-label">{n}</span>
              </div>
              {i < NODES.length - 1 && (
                <svg className="s4f-arrow" width="48" height="12" viewBox="0 0 48 12">
                  <line x1="0" y1="6" x2="42" y2="6" stroke="var(--rule)" strokeWidth="2" />
                  <polygon points="43,1 48,6 43,11" fill="var(--rule)" />
                </svg>
              )}
            </div>
          ))}
        </div>
        {step >= 5 && <span className="s4f-verdict">看起来顺畅，不代表没有问题</span>}
      </div>
    </div>
  );
}
