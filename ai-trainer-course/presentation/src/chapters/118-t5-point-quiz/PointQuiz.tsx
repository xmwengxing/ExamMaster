import type { ChapterStepProps } from "../../registry/types";
import "./PointQuiz.css";

export default function PointQuiz({ step }: ChapterStepProps) {
  return (
    <div className="t5q-root scene-pad">
      <div className="t5q-layout">
        <div className="t5q-header">
          <span className="t5q-eyebrow">S5 · 随堂测试</span>
          <h2 className="t5q-title">点云物理特性与融合仲裁测试题</h2>
        </div>

        {step >= 1 && (
          <div className="t5q-intro">
            <span>请认真作答后再关闭本集视频</span>
          </div>
        )}

        <div className="t5q-cards">
          <div className={"t5q-card " + (step >= 2 ? "t5q-card--active" : "")}>
            <div className="t5q-card-header">
              <span className="t5q-card-num">Q1</span>
              <span className="t5q-card-topic">点云物理特性</span>
            </div>
            <div className="t5q-card-question">
              <span>下列哪种情况最可能导致点云数据中出现「鬼影」目标？</span>
            </div>
            <div className="t5q-card-options">
              <span>A. 黑色吸光物体</span>
              <span>B. 玻璃幕墙镜面反射</span>
              <span>C. 雨天雪花噪点</span>
              <span>D. 金属反光表面</span>
            </div>
          </div>

          <div className={"t5q-card " + (step >= 3 ? "t5q-card--active" : "")}>
            <div className="t5q-card-header">
              <span className="t5q-card-num">Q2</span>
              <span className="t5q-card-topic">融合仲裁策略</span>
            </div>
            <div className="t5q-card-question">
              <span>当摄像头确认目标但点云完全缺失时，正确的SOP操作是？</span>
            </div>
            <div className="t5q-card-options">
              <span>A. 直接跳过不标注</span>
              <span>B. 以点云为准放弃该目标</span>
              <span>C. 结合图像2D边界打上LiDAR_Occlusion标签并虚拟插值</span>
              <span>D. 只标注点云中存在的目标</span>
            </div>
          </div>
        </div>

        {step >= 4 && (
          <div className="t5q-complete">
            <span>✅ 答题完成，恭喜您已完成本节学习！</span>
          </div>
        )}
      </div>
    </div>
  );
}
