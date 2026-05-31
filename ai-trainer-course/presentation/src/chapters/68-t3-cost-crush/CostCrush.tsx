import type { ChapterStepProps } from "../../registry/types";
import "./CostCrush.css";

export default function CostCrush({ step }: ChapterStepProps) {
  return (
    <div className="t3cc-root scene-pad">
      <div className="t3cc-layout">
        <div className="t3cc-table">
          <div className="t3cc-row t3cc-header-row">
            <span className="t3cc-col">对比项</span>
            <span className="t3cc-col">方案A</span>
            <span className="t3cc-col t3cc-col-accent">方案B</span>
          </div>
          <div className={`t3cc-row ${step >= 0 ? "t3cc-row-on" : "t3cc-row-off"}`}>
            <span className="t3cc-col">帧数/天</span>
            <span className="t3cc-col t3cc-bad">864万</span>
            <span className="t3cc-col t3cc-good">216万</span>
          </div>
          <div className={`t3cc-row ${step >= 0 ? "t3cc-row-on" : "t3cc-row-off"}`}>
            <span className="t3cc-col">标注费/天</span>
            <span className="t3cc-col t3cc-bad">¥173万</span>
            <span className="t3cc-col t3cc-good">¥43万 → ¥4.3万</span>
          </div>
          <div className={`t3cc-row ${step >= 0 ? "t3cc-row-on" : "t3cc-row-off"}`}>
            <span className="t3cc-col">有效帧率</span>
            <span className="t3cc-col t3cc-bad">&lt;10%</span>
            <span className="t3cc-col t3cc-good">100%</span>
          </div>
          <div className={`t3cc-row ${step >= 0 ? "t3cc-row-on" : "t3cc-row-off"}`}>
            <span className="t3cc-col">标注费/月</span>
            <span className="t3cc-col t3cc-bad">¥5400万</span>
            <span className="t3cc-col t3cc-good">¥1300万→¥130万</span>
          </div>
          <div className={`t3cc-row ${step >= 1 ? "t3cc-row-on" : "t3cc-row-off"}`}>
            <span className="t3cc-col">模型质量</span>
            <span className="t3cc-col t3cc-bad">背景过拟合</span>
            <span className="t3cc-col t3cc-good">泛化能力强</span>
          </div>
        </div>
        {step >= 2 && (
          <div className="t3cc-motto">
            <span className="t3cc-motto-text">错误的数据策略 = 花更多钱 · 训更差的模型</span>
          </div>
        )}
        {step >= 3 && (
          <div className="t3cc-next">
            <span className="t3cc-next-text">视频脱敏与ID跳变 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
