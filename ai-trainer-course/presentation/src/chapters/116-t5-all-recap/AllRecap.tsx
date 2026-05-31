import type { ChapterStepProps } from "../../registry/types";
import "./AllRecap.css";

export default function AllRecap({ step }: ChapterStepProps) {
  return (
    <div className="t5ar-root scene-pad">
      <div className="t5ar-layout">
        <h2 className="t5ar-title">完整课程回顾：四模块知识体系</h2>

        <div className="t5ar-modules">
          <div className={`t5ar-module ${step >= 1 ? "t5ar-module--on" : ""}`}>
            <div className="t5ar-module-icon">🔑</div>
            <div className="t5ar-module-body">
              <span className="t5ar-module-title">四维密码</span>
              <span className="t5ar-module-desc">X Y Z + 反射率 Int ensity · 区分材质核心武器</span>
            </div>
          </div>

          <div className={`t5ar-module ${step >= 1 ? "t5ar-module--on" : ""}`}>
            <div className="t5ar-module-icon">👓</div>
            <div className="t5ar-module-body">
              <span className="t5ar-module-title">先天盲区</span>
              <span className="t5ar-module-desc">稀疏性 + 遮挡透视无能 · 物理缺陷认知</span>
            </div>
          </div>

          <div className={`t5ar-module ${step >= 2 ? "t5ar-module--on" : ""}`}>
            <div className="t5ar-module-icon">🧹</div>
            <div className="t5ar-module-body">
              <span className="t5ar-module-title">清洗分割</span>
              <span className="t5ar-module-desc">时序滤波 + 反射率阈值 · 地面15cm高差规则</span>
            </div>
          </div>

          <div className={`t5ar-module ${step >= 3 ? "t5ar-module--on" : ""}`}>
            <div className="t5ar-module-icon">⚖️</div>
            <div className="t5ar-module-body">
              <span className="t5ar-module-title">融合仲裁</span>
              <span className="t5ar-module-desc">三级置信度 + 虚拟3D框插值 · 降维打击思维</span>
            </div>
          </div>
        </div>

        {step >= 4 && (
          <div className="t5ar-core">
            <span className="t5ar-core-text">训练师 = 物理世界 → 数字世界的转译者</span>
          </div>
        )}
      </div>
    </div>
  );
}