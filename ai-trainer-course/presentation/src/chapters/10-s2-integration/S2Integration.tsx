import type { ChapterStepProps } from "../../registry/types";
import "./S2Integration.css";

export default function S2Integration({ step }: ChapterStepProps) {
  return (
    <div className="ig-root scene-pad">
      <div className="ig-center">
        {step <= 2 && (
          <>
            <span className="ig-gear-label">系统集成</span>
            <div className="ig-sys-row">
              <div className="ig-sys-box">
                <span className="ig-sys-text">ERP</span>
              </div>
              <span className="ig-sys-connect">←→</span>
              <div className="ig-sys-box ig-sys-accent">
                <span className="ig-sys-text">AI Model</span>
              </div>
              <span className="ig-sys-connect">←→</span>
              <div className="ig-sys-box">
                <span className="ig-sys-text">CRM</span>
              </div>
            </div>
            {step >= 1 && <span className="ig-jupyter-note">Jupyter Notebook → 生产系统</span>}
          </>
        )}
        {step >= 2 && (
          <>
            <span className="ig-gear-label ig-gear-spacer">运营迭代</span>
            <div className="ig-flywheel">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="52" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.5" />
                {[30,90,150,210,270,330].map((a, i) => (
                  <polygon key={i} points="-7,-5 7,0 -7,5" fill="var(--accent)" opacity="0.4"
                    transform={`translate(70,70) rotate(${a}) translate(0,-52)`} />
                ))}
              </svg>
              <span className="ig-flywheel-label">数据飞轮</span>
            </div>
          </>
        )}
        {step >= 3 && (
          <span className="ig-footer-text">
            {step >= 4 ? "运营迭代是整个闭环的发动机" : "模型上线之后的持续进化"}
          </span>
        )}
      </div>
    </div>
  );
}
