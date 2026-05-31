import type { ChapterStepProps } from "../../registry/types";
import "./PortAssignment.css";

export default function PortAssignment({ step }: ChapterStepProps) {
  return (
    <div className="t5pa-root scene-pad">
      <div className="t5pa-layout">
        <div className="t5pa-header">
          <span className="t5pa-eyebrow">S5 · 通关任务</span>
          <h2 className="t5pa-title">港口集装箱卡车 SOP 作业发布</h2>
        </div>

        <div className="t5pa-context">
          <span className="t5pa-context-title">项目背景</span>
          <span className="t5pa-context-desc">港口无人驾驶集装箱卡车</span>
          <div className="t5pa-challenges">
            <div className={"t5pa-challenge " + (step >= 1 ? "t5pa-challenge--on" : "")}>
              <span className="t5pa-challenge-icon">🏗️</span>
              <span>金属反光物 → 噪点/虚检</span>
            </div>
            <div className={"t5pa-challenge " + (step >= 1 ? "t5pa-challenge--on" : "")}>
              <span className="t5pa-challenge-icon">🌫️</span>
              <span>高浓度粉尘 → 干扰穿透</span>
            </div>
            <div className={"t5pa-challenge " + (step >= 2 ? "t5pa-challenge--on" : "")}>
              <span className="t5pa-challenge-icon">📦</span>
              <span>频繁移动集装箱 → 轨迹干扰</span>
            </div>
          </div>
        </div>

        <div className="t5pa-deliverables">
          <span className="t5pa-deliverables-title">SOP 文档必须包含</span>
          <div className="t5pa-items">
            <div className={"t5pa-item " + (step >= 2 ? "t5pa-item--on" : "")}>
              <div className="t5pa-item-num">1</div>
              <div className="t5pa-item-body">
                <span className="t5pa-item-title">粉尘噪点过滤规则</span>
                <span className="t5pa-item-desc">如何区分粉尘云团和真实障碍物</span>
              </div>
            </div>
            <div className={"t5pa-item " + (step >= 3 ? "t5pa-item--on" : "")}>
              <div className="t5pa-item-num">2</div>
              <div className="t5pa-item-body">
                <span className="t5pa-item-title">金属反光处理规范</span>
                <span className="t5pa-item-desc">镜面反射处理 + 失效标签场景</span>
              </div>
            </div>
            <div className={"t5pa-item " + (step >= 4 ? "t5pa-item--on" : "")}>
              <div className="t5pa-item-num">3</div>
              <div className="t5pa-item-body">
                <span className="t5pa-item-title">点云缺失插值规范</span>
                <span className="t5pa-item-desc">虚拟3D框使用场景和插值方法</span>
              </div>
            </div>
          </div>
        </div>

        {step >= 4 && (
          <div className="t5pa-cta">
            <span>📤 请下载 SOP 模板并上传您的作业</span>
          </div>
        )}
      </div>
    </div>
  );
}
