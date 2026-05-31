import type { ChapterStepProps } from "../../registry/types";
import "./CoursePromise.css";

const ABILITIES = [
  { label: "分析业务场景", desc: "判断运动特征 → 选抽帧策略" },
  { label: "设计降采样方案", desc: "帮公司省下几十万预算" },
  { label: "处理视频隐私", desc: "人脸·车牌脱敏合规" },
  { label: "规范标注质量", desc: "ID跳变·遮挡处理规则" },
];

export default function CoursePromise({ step }: ChapterStepProps) {
  return (
    <div className="t3cp-root scene-pad">
      <div className="t3cp-layout">
        <div className="t3cp-left">
          <div className="t3cp-before-after">
            <div className="t3cp-before">
              <span className="t3cp-ba-label">之前</span>
              <span className="t3cp-ba-text">ffmpeg -r 30</span>
              <span className="t3cp-ba-note">只会写命令</span>
            </div>
            <div className="t3cp-arrow">→</div>
            <div className="t3cp-after">
              <span className="t3cp-ba-label">之后</span>
              <span className="t3cp-ba-text">分析场景 → 选策略 → 输出方案</span>
              <span className="t3cp-ba-note t3cp-ba-accent">训练师的核心能力</span>
            </div>
          </div>
        </div>
        <div className="t3cp-right">
          <span className="t3cp-abilities-title">这节课之后你将掌握</span>
          <div className="t3cp-abilities">
            {ABILITIES.map((a, i) => (
              <div key={a.label} className={`t3cp-ability ${i <= step - 1 ? "t3cp-ab-on" : "t3cp-ab-off"}`}>
                <span className="t3cp-ab-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="t3cp-ab-body">
                  <span className="t3cp-ab-label">{a.label}</span>
                  <span className="t3cp-ab-desc">{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
          {step >= 3 && (
            <div className="t3cp-start">
              <span className="t3cp-start-text">抽帧三剑客 · 现在开始</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
