import type { ChapterStepProps } from "../../registry/types";
import "./Tsunami.css";

export default function Tsunami({ step }: ChapterStepProps) {
  return (
    <div className="t3ts-root scene-pad">
      <div className="t3ts-layout">
        <div className="t3ts-left">
          <div className="t3ts-intro">
            <span className="t3ts-tag">人工智能训练师 · 三级</span>
            <span className="t3ts-instructor">翁老师</span>
            {step >= 1 && <span className="t3ts-lesson">第三节课 · 视频类业务数据处理</span>}
          </div>
          {step >= 2 && (
            <div className="t3ts-project-card">
              <span className="t3ts-project-name">智慧工厂 · 安防AI项目</span>
              <div className="t3ts-project-stats">
                <span className="t3ts-stat">1000 路高清摄像头</span>
                <span className="t3ts-stat-big">1 PB 视频数据</span>
                <span className="t3ts-stat">投入超 1000 万</span>
              </div>
            </div>
          )}
        </div>
        <div className="t3ts-right">
          {step >= 3 && (
            <div className="t3ts-cost-alert">
              <span className="t3ts-cost-label">项目成本警报</span>
              <div className="t3ts-cost-items">
                <div className="t3ts-cost-row">
                  <span className="t3ts-cost-name">硬盘存储</span>
                  <span className="t3ts-cost-bar t3ts-bar-red" style={{width:'180px'}} />
                  <span className="t3ts-cost-num">300万+</span>
                </div>
                <div className="t3ts-cost-row">
                  <span className="t3ts-cost-name">标注外包</span>
                  <span className="t3ts-cost-bar t3ts-bar-red" style={{width:'240px'}} />
                  <span className="t3ts-cost-num">400万+</span>
                </div>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="t3ts-impact">
              <span className="t3ts-impact-item">存储超支 300%</span>
              <span className="t3ts-impact-item">标注超支 400%</span>
              <span className="t3ts-impact-item">标了半年不到 30%</span>
            </div>
          )}
          {step >= 5 && (
            <div className="t3ts-root-cause">
              <span className="t3ts-root-label">根本原因</span>
              <span className="t3ts-root-text">没有在数据源头对视频做预处理</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
