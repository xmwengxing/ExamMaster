import type { ChapterStepProps } from "../../registry/types";
import "./BlackTruck.css";

export default function BlackTruck({ step }: ChapterStepProps) {
  return (
    <div className="t5bt-root scene-pad">
      <div className="t5bt-layout">
        <div className="t5bt-left">
          <div className="t5bt-intro">
            <span className="t5bt-tag">人工智能训练师 · 三级</span>
            <span className="t5bt-instructor">翁老师</span>
            {step >= 1 && <span className="t5bt-lesson">第五节课 · 点云类业务数据处理</span>}
          </div>
          {step >= 2 && (
            <div className="t5bt-accident">
              <span className="t5bt-acc-title">真实事故回溯</span>
              <div className="t5bt-acc-scene">
                <span className="t5bt-acc-car">🚗 L2辅助驾驶 · 100km/h</span>
                <span className="t5bt-acc-arrow">→</span>
                <span className="t5bt-acc-truck">🚛 货车横穿马路</span>
                <span className="t5bt-acc-result">💥 毫无减速 · 直接追尾</span>
              </div>
            </div>
          )}
        </div>
        <div className="t5bt-right">
          {step >= 3 && (
            <div className="t5bt-investigation">
              <span className="t5bt-inv-title">事故调查结论</span>
              <span className="t5bt-inv-ok">✅ 刹车系统正常</span>
              <span className="t5bt-inv-ok">✅ 控制算法正常</span>
              <span className="t5bt-inv-fail">❌ LiDAR 完全没检测到货车</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t5bt-reason">
              <span className="t5bt-reason-title">物理根因</span>
              <span className="t5bt-reason-text">平整金属表面 + 深色油漆 → 镜面反射 → 激光偏转</span>
              <span className="t5bt-reason-tag">黑色吸光物体检测盲区</span>
            </div>
          )}
          {step >= 5 && (
            <div className="t5bt-lesson-card">
              <span className="t5bt-lesson-text">不了解物理缺陷的模型 = 实验室满分 · 上路事故</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
