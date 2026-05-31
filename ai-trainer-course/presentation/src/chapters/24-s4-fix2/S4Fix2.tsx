import type { ChapterStepProps } from "../../registry/types";
import "./S4Fix2.css";

export default function S4Fix2({ step }: ChapterStepProps) {
  return (
    <div className="s4y-root scene-pad">
      <div className="s4y-center">
        <span className="s4y-vuln-label">漏洞 2 · 缺失反馈闭环（最致命）</span>
        <div className="s4y-diagram">
          <div className="s4y-flow-top">
            <span className="s4y-flow-node">AI 推荐</span>
            <span className="s4y-flow-arrow">→</span>
            <span className="s4y-flow-node">顾客下单</span>
            <span className="s4y-flow-arrow">→</span>
            <span className="s4y-flow-node">顾客结账</span>
          </div>
          <div className="s4y-gap">{step >= 1 ? "？" : ""}</div>
          {step >= 1 && (
            <div className="s4y-feedback">
              <svg className="s4y-loop-arrow" width="520" height="60" viewBox="0 0 520 60">
                <path d="M440 30 L440 50 L80 50 L80 30"
                  stroke="var(--accent)" strokeWidth="3" fill="none" strokeDasharray="8 5"
                  strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="74,24 80,16 86,24" fill="var(--accent)" />
              </svg>
              <div className="s4y-feedback-node">
                <span className="s4y-fb-title">反馈闭环</span>
                <span className="s4y-fb-text">光盘数据 → 负反馈 → 惩罚权重</span>
              </div>
            </div>
          )}
        </div>
        {step >= 2 && (
          <span className="s4y-scenario">AI把失败的推荐误判为成功，每月越推越偏</span>
        )}
        {step >= 3 && (
          <div className="s4y-rule-block">
            <span className="s4y-rule-title">铁律</span>
            <span className="s4y-rule-text">没有反馈闭环的AI，退化不是概率问题，是必然</span>
          </div>
        )}
      </div>
    </div>
  );
}
