import type { ChapterStepProps } from "../../registry/types";
import "./SnowNoise.css";

export default function SnowNoise({ step }: ChapterStepProps) {
  return (
    <div className="t5sn-root scene-pad">
      <div className="t5sn-layout">
        <div className="t5sn-left">
          <div className="t5sn-header">
            <span className="t5sn-icon">🌨️</span>
            <span className="t5sn-title">雨雪天噪点</span>
            <span className="t5sn-sub">激光打在雨滴雪花上的虚假回波</span>
          </div>
          <div className="t5sn-demo">
            <div className="t5sn-scene-box">
              <span className="t5sn-scene-label">点云俯视视角</span>
              <div className="t5sn-scene-canvas">
                {Array.from({length:60}).map((_,i)=>{
                  const x=20+Math.random()*340,y=50+Math.random()*120;
                  return <div key={i} className={`t5sn-dot ${i<40?"t5sn-noise":"t5sn-real"}`} style={{left:x,top:y,width:4+Math.random()*3,height:4+Math.random()*3,animationDelay:`${Math.random()*1.5}s`}}/>
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="t5sn-right">
          {step >= 1 && (
            <div className="t5sn-consequence">
              <span className="t5sn-cons-title">致命后果</span>
              <span className="t5sn-cons-item">系统判定前方有障碍物 → 触发紧急制动</span>
              <span className="t5sn-cons-item">实际空无一物 → 后车追尾</span>
              <span className="t5sn-cons-badge">幽灵刹车</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5sn-case">
              <span className="t5sn-case-title">真实事故</span>
              <span className="t5sn-case-text">测试车在细雨中检测到30m处密集点群 → 减速 → 后车追尾</span>
              <span className="t5sn-case-verdict">根因：训练师未制定雨雪噪点清洗规则</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5sn-severity">
              <span className="t5sn-sev-text">噪点清洗不是锦上添花 — 是生死攸关</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
