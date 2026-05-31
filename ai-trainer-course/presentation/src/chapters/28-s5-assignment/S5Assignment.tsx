import type { ChapterStepProps } from "../../registry/types";
import "./S5Assignment.css";

export default function S5Assignment({ step }: ChapterStepProps) {
  return (
    <div className="s5a-root scene-pad">
      <div className="s5a-center">
        <div className="s5a-card">
          <span className="s5a-badge">通关任务 L2 结果性评价</span>
          <span className="s5a-title">AI 业务流程与数据字典标准模板</span>
          <div className="s5a-download">
            <span className="s5a-link">点击下方链接下载模板</span>
          </div>
          <div className="s5a-qr">
            <span className="s5a-qr-text">二维码</span>
          </div>
        </div>
        <div className="s5a-checklist">
          <div className={`s5a-check-row ${step >= 1 ? "s5a-check-on" : ""}`}>
            <span className="s5a-check-num">1</span>
            <span className="s5a-check-text">绘制包含数据流转线的业务流程图</span>
          </div>
          <div className={`s5a-check-row ${step >= 2 ? "s5a-check-on" : ""}`}>
            <span className="s5a-check-num">2</span>
            <span className="s5a-check-text">标注 ≥ 2 个跨系统数据断点</span>
          </div>
          <div className={`s5a-check-row ${step >= 3 ? "s5a-check-on" : ""}`}>
            <span className="s5a-check-num">3</span>
            <span className="s5a-check-text">计入三级认证总成绩</span>
          </div>
        </div>
      </div>
    </div>
  );
}
