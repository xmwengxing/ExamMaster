import type { ChapterStepProps } from "../../registry/types";
import "./Quiz.css";

export default function Quiz({ step }: ChapterStepProps) {
  return (
    <div className="t2qz-root scene-pad">
      <div className="t2qz-layout">
        <div className="t2qz-left">
          <span className="t2qz-header">随堂检测</span>
          <div className="t2qz-questions">
            <div className={`t2qz-q ${step >= 1 ? "t2qz-q-on" : "t2qz-q-off"}`}>
              <span className="t2qz-q-num">Q1</span>
              <div className="t2qz-q-body">
                <span className="t2qz-q-text">以下哪一项不属于五步流水线的标准步骤？</span>
                <div className="t2qz-q-opts">
                  <span className="t2qz-opt">A. 采集</span>
                  <span className="t2qz-opt">B. 增强</span>
                  <span className="t2qz-opt t2qz-opt-right">C. 标注 ✓</span>
                  <span className="t2qz-opt">D. 清洗</span>
                </div>
              </div>
            </div>
            <div className={`t2qz-q ${step >= 2 ? "t2qz-q-on" : "t2qz-q-off"}`}>
              <span className="t2qz-q-num">Q2</span>
              <div className="t2qz-q-body">
                <span className="t2qz-q-text">'这衣服绝了，穿上直接去要饭'的正确标注是？</span>
                <div className="t2qz-q-opts">
                  <span className="t2qz-opt">A. 好评</span>
                  <span className="t2qz-opt t2qz-opt-right">B. 差评 ✓</span>
                  <span className="t2qz-opt">C. 中性</span>
                  <span className="t2qz-opt">D. 无法判断</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="t2qz-right">
          {step >= 0 && (
            <div className="t2qz-rule-hint">
              <span className="t2qz-hint-title">Q2 判定规则</span>
              <span className="t2qz-hint-text">褒义词 + 负面场景 → 反讽 · 差评</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t2qz-pass">
              <span className="t2qz-pass-text">两道题 = 两个核心考点</span>
              <span className="t2qz-pass-sub">五步流水线 + 反讽争议标注</span>
              <span className="t2qz-pass-next">答对？恭喜掌握核心框架 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
