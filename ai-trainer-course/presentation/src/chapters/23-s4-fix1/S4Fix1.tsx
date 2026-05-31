import type { ChapterStepProps } from "../../registry/types";
import "./S4Fix1.css";

export default function S4Fix1({ step }: ChapterStepProps) {
  return (
    <div className="s4x-root scene-pad">
      <div className="s4x-center">
        <span className="s4x-vuln-label">漏洞 1 · 缺失输入数据源</span>
        <div className="s4x-chain">
          <div className={`s4x-box s4x-missing ${step >= 0 ? "s4x-box-on" : ""}`}>
            <span className="s4x-box-title">输入数据源</span>
            <div className="s4x-details">
              <span className="s4x-detail">用户画像</span>
              <span className="s4x-detail">环境数据</span>
              <span className="s4x-detail">会员等级</span>
            </div>
          </div>
          <svg className="s4x-arrow" width="40" height="12" viewBox="0 0 40 12">
            <line x1="0" y1="6" x2="34" y2="6" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" />
            <polygon points="35,1 40,6 35,11" fill="var(--accent)" />
          </svg>
          <div className="s4x-box s4x-ai">
            <span className="s4x-box-title">AI 推荐菜品</span>
          </div>
        </div>
        {step >= 2 && (
          <span className="s4x-question">没有输入，哪来输出？</span>
        )}
        {step >= 3 && (
          <div className="s4x-examples">
            <span className="s4x-example">天气冷推火锅？</span>
            <span className="s4x-example">会员推高利润菜？</span>
          </div>
        )}
        {step >= 4 && (
          <span className="s4x-rule-text">每个AI节点之前，必须有一个明确的数据输入源</span>
        )}
      </div>
    </div>
  );
}
