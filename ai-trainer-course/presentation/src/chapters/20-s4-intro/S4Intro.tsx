import type { ChapterStepProps } from "../../registry/types";
import "./S4Intro.css";

export default function S4Intro({ step }: ChapterStepProps) {
  return (
    <div className="s4i-root scene-pad">
      <div className="s4i-center">
        <div className="s4i-title-block">
          <span className="s4i-main">实战找茬</span>
          <div className="s4i-rule" />
          <span className="s4i-sub">智慧餐厅 AI 点餐推荐系统</span>
        </div>
        {step >= 1 && (
          <span className="s4i-hint">用全链路闭环的视角，找出缺失的致命节点</span>
        )}
      </div>
    </div>
  );
}
