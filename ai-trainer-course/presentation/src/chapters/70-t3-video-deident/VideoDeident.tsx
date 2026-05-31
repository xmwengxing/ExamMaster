import type { ChapterStepProps } from "../../registry/types";
import "./VideoDeident.css";

export default function VideoDeident({ step }: ChapterStepProps) {
  return (
    <div className="t3vd-root scene-pad">
      <div className="t3vd-layout">
        <div className="t3vd-left">
          <div className="t3vd-header">
            <span className="t3vd-title">视频脱敏</span>
            <span className="t3vd-sub">可视化隐私的合规红线</span>
          </div>
          <div className="t3vd-targets">
            {[
              { icon: "👤", label: "人脸", desc: "最核心最敏感", show: step >= 1 },
              { icon: "🚗", label: "车牌", desc: "交通·车载场景", show: step >= 1 },
              { icon: "🔖", label: "标记物", desc: "纹身·胸牌·工卡号", show: step >= 2 },
            ].map((t) => (
              <div key={t.label} className={`t3vd-target ${t.show ? "t3vd-on" : "t3vd-off"}`}>
                <span className="t3vd-t-icon">{t.icon}</span>
                <span className="t3vd-t-label">{t.label}</span>
                <span className="t3vd-t-desc">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="t3vd-right">
          {step >= 2 && (
            <div className="t3vd-methods">
              <span className="t3vd-m-title">脱敏手段</span>
              <div className="t3vd-m-card">
                <span className="t3vd-m-name">高斯模糊</span>
                <span className="t3vd-m-desc">保留轮廓和位置 · 可标注</span>
              </div>
              <div className="t3vd-m-card">
                <span className="t3vd-m-name">马赛克/纯色覆盖</span>
                <span className="t3vd-m-desc">更高保护等级 · 损失部分可用性</span>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="t3vd-flow">
              <span className="t3vd-flow-title">正确流程</span>
              <span className="t3vd-flow-text">数据导出 → 自动化检测脚本 → 模糊处理 → 分发给外包</span>
            </div>
          )}
          {step >= 5 && (
            <div className="t3vd-next">
              <span className="t3vd-next-text">更棘手的问题：ID跳变 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
