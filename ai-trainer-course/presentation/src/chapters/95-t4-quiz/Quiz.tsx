import type { ChapterStepProps } from "../../registry/types";
import "./Quiz.css";

export default function Quiz({ step }: ChapterStepProps) {
  return (
    <div className="t4qz-root scene-pad">
      <div className="t4qz-layout">
        <span className="t4qz-title">随堂检测 · 音频属性与切片策略</span>
        <div className="t4qz-questions">
          <div className={`t4qz-q ${step >= 1 ? "t4qz-q-on" : "t4qz-q-off"}`}>
            <span className="t4qz-q-num">Q1</span>
            <div className="t4qz-q-body">
              <span className="t4qz-q-text">呼叫中心双声道录音，坐席左声道/客户右声道，正确做法？</span>
              <div className="t4qz-q-opts">
                <span className="t4qz-opt">A. 合成单声道</span>
                <span className="t4qz-opt t4qz-opt-right">B. 只听取客户声道 ✓</span>
                <span className="t4qz-opt">C. 随机选一个声道</span>
              </div>
            </div>
          </div>
          <div className={`t4qz-q ${step >= 2 ? "t4qz-q-on" : "t4qz-q-off"}`}>
            <span className="t4qz-q-num">Q2</span>
            <div className="t4qz-q-body">
              <span className="t4qz-q-text">智能客服意图识别，用户话中有嗯、啊等语气词，如何处理？</span>
              <div className="t4qz-q-opts">
                <span className="t4qz-opt t4qz-opt-right">A. 过滤掉 ✓</span>
                <span className="t4qz-opt">B. 保留并标注hesitation</span>
                <span className="t4qz-opt">C. 翻译成标准文本</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
