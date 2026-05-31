import { useState } from "react";
import type { ChapterStepProps } from "../../registry/types";
import "./S5Quiz.css";

const QUIZ1 = [
  { id: "a", text: "需求定义", order: 0 },
  { id: "b", text: "数据准备", order: 1 },
  { id: "c", text: "模型训练与评估", order: 2 },
  { id: "d", text: "系统集成", order: 3 },
  { id: "e", text: "运营迭代", order: 4 },
];

const QUIZ2 = [
  { id: "a", text: "触发", order: 0 },
  { id: "b", text: "数据", order: 1 },
  { id: "c", text: "推理", order: 2 },
  { id: "d", text: "集成", order: 3 },
  { id: "e", text: "迭代", order: 4 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function SortQuiz({
  title,
  items,
}: {
  title: string;
  items: { id: string; text: string; order: number }[];
}) {
  const [cards, setCards] = useState(() => shuffle(items));
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [sel, setSel] = useState<number | null>(null);

  const swap = (i: number) => {
    if (checked) return;
    if (sel === null) { setSel(i); return; }
    if (sel !== i) {
      const next = [...cards];
      [next[sel], next[i]] = [next[i]!, next[sel]!];
      setCards(next);
    }
    setSel(null);
  };

  const check = () => {
    const ok = cards.every((c, i) => c.order === i);
    setChecked(true);
    setCorrect(ok);
  };

  const reset = () => {
    setCards(shuffle(items));
    setChecked(false);
    setCorrect(false);
    setSel(null);
  };

  return (
    <div className="sq-quiz-block">
      <span className="sq-q-title">{title}</span>
      <div className="sq-cards-row">
        {cards.map((c, i) => (
          <div
            key={c.id}
            data-no-advance
            className={`sq-sort-card ${sel === i ? "sq-sel" : ""} ${checked && c.order === i ? "sq-card-ok" : ""} ${checked && c.order !== i ? "sq-card-wrong" : ""}`}
            onClick={() => swap(i)}
          >
            <span className="sq-card-idx">{i + 1}</span>
            <span className="sq-card-text">{c.text}</span>
          </div>
        ))}
      </div>
      <div className="sq-actions">
        {!checked ? (
          <button data-no-advance className="sq-btn sq-btn-check" onClick={check}>确认顺序</button>
        ) : (
          <>
            <span className={`sq-result ${correct ? "sq-result-ok" : "sq-result-fail"}`}>
              {correct ? "✓ 正确！" : "✗ 不正确"}
            </span>
            {!correct && (
              <button data-no-advance className="sq-btn sq-btn-retry" onClick={reset}>重新排列</button>
            )}
          </>
        )}
      </div>
      {checked && !correct && (
        <div className="sq-answer">
          <span className="sq-answer-label">正确答案：</span>
          {[...items].sort((a, b) => a.order - b.order).map((it) => (
            <span key={it.id} className="sq-answer-item">{it.text}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function S5Quiz({ step }: ChapterStepProps) {
  return (
    <div className="sq-root scene-pad">
      <div className="sq-center">
        {step <= 1 && (
          <>
            <span className="sq-header">课后测验</span>
            <div className="sq-cards-wrap">
              <div className={`sq-info-card ${step >= 0 ? "sq-card-on" : ""}`}>
                <span className="sq-icon">🔢</span>
                <span className="sq-name">流程节点排序</span>
              </div>
              <div className={`sq-info-card ${step >= 1 ? "sq-card-on" : ""}`}>
                <span className="sq-icon">📊</span>
                <span className="sq-name">数据类型判断</span>
              </div>
            </div>
            {step >= 1 && <span className="sq-note">答对后再关闭本集视频</span>}
          </>
        )}
        {step === 2 && (
          <SortQuiz title="题1：五齿轮全链路排序" items={QUIZ1} />
        )}
        {step === 3 && (
          <SortQuiz title="题2：银行智能催收流程排序" items={QUIZ2} />
        )}
      </div>
    </div>
  );
}
