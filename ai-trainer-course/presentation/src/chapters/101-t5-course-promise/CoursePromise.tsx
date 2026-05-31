import type { ChapterStepProps } from "../../registry/types";
import "./CoursePromise.css";

const MODULES = [
  { icon: "📐", title: "四维密码", desc: "XYZ + 反射率 Intensity" },
  { icon: "🕳️", title: "先天盲区", desc: "稀疏性 · 遮挡穿透" },
  { icon: "🧹", title: "清洗与地面分割", desc: "雪花噪点 · 地面分离" },
  { icon: "⚖️", title: "融合仲裁", desc: "多传感器数据打架 · 置信度分级" },
];

export default function CoursePromise({ step }: ChapterStepProps) {
  return (
    <div className="t5cp-root scene-pad">
      <div className="t5cp-layout">
        <div className="t5cp-left">
          <span className="t5cp-title">今日课程结构</span>
          <div className="t5cp-modules">
            {MODULES.map((m, i) => (
              <div key={m.title} className={`t5cp-mod ${i <= step - 1 ? "t5cp-mod-on" : "t5cp-mod-off"}`}>
                <span className="t5cp-mod-icon">{m.icon}</span>
                <div className="t5cp-mod-body">
                  <span className="t5cp-mod-title">{m.title}</span>
                  <span className="t5cp-mod-desc">{m.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="t5cp-right">
          {step >= 2 && (
            <div className="t5cp-start">
              <span className="t5cp-start-label">S2 开始</span>
              <span className="t5cp-start-text">点云的四维密码 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
