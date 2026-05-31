import type { ChapterStepProps } from "../../registry/types";
import "./SopAssignment.css";

export default function SopAssignment({ step }: ChapterStepProps) {
  return (
    <div className="sop-root scene-pad">
      <div className="sop-layout">
        <div className="sop-left">
          <span className="sop-header">考核任务</span>
          <div className="sop-doc">
            <span className="sop-doc-title">📄 文本数据处理SOP模板</span>
            <div className="sop-requirements">
              <div className={`sop-req ${step >= 1 ? "sop-req-on" : "sop-req-off"}`}>
                <span className="sop-req-num">01</span>
                <div className="sop-req-body">
                  <span className="sop-req-title">清洗正则规则</span>
                  <span className="sop-req-desc">正则表达式 + 适用场景说明</span>
                </div>
              </div>
              <div className={`sop-req ${step >= 1 ? "sop-req-on" : "sop-req-off"}`}>
                <span className="sop-req-num">02</span>
                <div className="sop-req-body">
                  <span className="sop-req-title">歧义处理定义</span>
                  <span className="sop-req-desc">≥3条规则 + 每条≥2个Golden Samples</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sop-right">
          {step >= 0 && (
            <div className="sop-info">
              <span className="sop-info-label">提交信息</span>
              <div className="sop-info-items">
                <span className="sop-info-item">👤 教研团队逐份批改</span>
                <span className="sop-info-item">📊 计入三级认证总成绩</span>
                <span className="sop-info-item">⏰ 课程结束后一周内提交</span>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="sop-tip">
              <span className="sop-tip-title">💡 往期经验</span>
              <span className="sop-tip-text">SOP写得最扎实的学员，在实际项目中处理数据的能力明显高出平均水平。写SOP = 把隐性知识显性化。</span>
            </div>
          )}
          {step >= 3 && (
            <div className="sop-cta">
              <span className="sop-cta-text">认真对待，不要为了交作业而写模板套话。</span>
              <span className="sop-cta-sub">把它当成你要给标注员和算法工程师用的实际工作文档。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
