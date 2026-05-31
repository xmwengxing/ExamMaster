import type { ChapterStepProps } from "../../registry/types";
import "./PbVsImage.css";

export default function PbVsImage({ step }: ChapterStepProps) {
  return (
    <div className="t3pb-root scene-pad">
      <div className="t3pb-layout">
        <div className="t3pb-left">
          <div className="t3pb-mistake">
            <span className="t3pb-mistake-title">❌ 认知错误</span>
            <span className="t3pb-mistake-text">视频 = 一组放大的图片</span>
            <div className="t3pb-dims">
              <div className="t3pb-dim t3pb-dim-img">
                <span className="t3pb-dim-label">图像</span>
                <span className="t3pb-dim-axes">W × H</span>
              </div>
              <div className="t3pb-dim t3pb-dim-vid">
                <span className="t3pb-dim-label">视频</span>
                <span className="t3pb-dim-axes">W × H × T</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3pb-right">
          {step >= 0 && (
            <div className="t3pb-spacetime">
              <span className="t3pb-st-title">时空属性</span>
              <span className="t3pb-st-desc">信息同时在空间分布、在时间关联</span>
            </div>
          )}
          {step >= 1 && (
            <div className="t3pb-stats">
              <span className="t3pb-stats-big">95%</span>
              <span className="t3pb-stats-text">相邻帧信息重复率（行车记录仪）</span>
              <span className="t3pb-stats-note">每秒30帧 → 28帧的标注成本白白浪费</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t3pb-consequences">
              <span className="t3pb-cons-title">忽视时空属性的三个后果</span>
              <div className="t3pb-cons-list">
                <span className="t3pb-cons-item">💾 存储爆炸 — 1PB吃光项目预算</span>
                <span className="t3pb-cons-item">💰 标注负债 — 30倍冤枉钱</span>
                <span className="t3pb-cons-item">📉 模型退化 — 过拟合·生产崩溃</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t3pb-principle">
              <span className="t3pb-principle-text">第一原则：降维</span>
              <span className="t3pb-principle-sub">不是删数据，是剔除冗余、保留信息</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
