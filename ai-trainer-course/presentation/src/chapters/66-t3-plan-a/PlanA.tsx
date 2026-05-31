import type { ChapterStepProps } from "../../registry/types";
import "./PlanA.css";

export default function PlanA({ step }: ChapterStepProps) {
  return (
    <div className="t3pa-root scene-pad">
      <div className="t3pa-layout">
        <div className="t3pa-left">
          <div className="t3pa-header">
            <span className="t3pa-label">方案 A</span>
            <span className="t3pa-name">全量均匀抽帧</span>
            <span className="t3pa-sub">240路 × 1FPS × 10h/天</span>
          </div>
          <div className="t3pa-calc">
            <span className="t3pa-calc-title">算账</span>
            <div className="t3pa-calc-steps">
              <div className="t3pa-calc-step">
                <span className="t3pa-calc-op">240路 × 36000秒</span>
                <span className="t3pa-calc-eq">=</span>
                <span className="t3pa-calc-num">864万 帧/天</span>
              </div>
              <div className="t3pa-calc-step">
                <span className="t3pa-calc-op">864万 × ¥0.2/张</span>
                <span className="t3pa-calc-eq">=</span>
                <span className="t3pa-calc-num t3pa-calc-red">¥173万/天</span>
              </div>
              <div className="t3pa-calc-step">
                <span className="t3pa-calc-op">× 30天</span>
                <span className="t3pa-calc-eq">=</span>
                <span className="t3pa-calc-num t3pa-calc-big">¥5400万/月</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3pa-right">
          {step >= 3 && (
            <div className="t3pa-waste">
              <span className="t3pa-waste-title">90% 是无效帧</span>
              <span className="t3pa-waste-desc">空地、正常走动 → 花了173万标注空气</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3pa-overfit">
              <span className="t3pa-overfit-title">背景过拟合</span>
              <span className="t3pa-overfit-text">模型学会了识别特定工地背景，而不是识别安全帽</span>
              <span className="t3pa-overfit-note">换工地部署 → 准确率断崖式下跌</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t3pa-verdict">
              <span className="t3pa-verdict-text">方案A不是差，是灾难</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
