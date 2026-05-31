import type { ChapterStepProps } from "../../registry/types";
import "./GuidelineIntro.css";

const QUESTIONS = [
  { num: "Q1", text: "语气词 嗯/啊/那个... 要不要转写？", show: 0 },
  { num: "Q2", text: "口吃 我我我要退款 → 修正还是保留？", show: 0 },
  { num: "Q3", text: "方言/口音 → 翻译成普通话还是如实记录？", show: 1 },
];

export default function GuidelineIntro({ step }: ChapterStepProps) {
  return (
    <div className="t4gi-root scene-pad">
      <div className="t4gi-layout">
        <div className="t4gi-left">
          <span className="t4gi-title">转写指南 · 三大灵魂拷问</span>
          <div className="t4gi-questions">
            {QUESTIONS.map((q) => (
              <div key={q.num} className={`t4gi-q ${step >= q.show ? "t4gi-q-on" : "t4gi-q-off"}`}>
                <span className="t4gi-q-num">{q.num}</span>
                <span className="t4gi-q-text">{q.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="t4gi-right">
          {step >= 2 && (
            <div className="t4gi-principle">
              <span className="t4gi-principle-text">答案取决于下游业务目标</span>
              <span className="t4gi-principle-sub">没有脱离场景的绝对正确或绝对错误</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4gi-next">
              <span className="t4gi-next-text">拷问一：语气词与口吃 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
