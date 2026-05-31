import type { ChapterStepProps } from "../../registry/types";
import "./Judgment.css";

export default function Judgment({ step }: ChapterStepProps) {
  return (
    <div className="t4ju-root scene-pad">
      <div className="t4ju-layout">
        <div className="t4ju-left">
          <div className="t4ju-framework">
            <span className="t4ju-fw-title">统一思考框架</span>
            <div className="t4ju-scenarios">
              {[
                { q: "语气词 保留/过滤？", a: "意图识别→过滤 / 情绪分析→保留", show: step >= 0 },
                { q: "口吃 修正/保留？", a: "标准转写→修正 / 鲁棒性训练→保留", show: step >= 0 },
                { q: "方言 译普通话/如实记录？", a: "标普用户→翻译 / 方言区用户→原样", show: step >= 0 },
                { q: "重叠音 丢弃/标注？", a: "ASR→丢弃 / 情绪打断→核心资产", show: step >= 1 },
              ].map((s, i) => (
                <div key={i} className={`t4ju-scene ${s.show ? "t4ju-scene-on" : "t4ju-scene-off"}`}>
                  <span className="t4ju-scene-q">{s.q}</span>
                  <span className="t4ju-scene-a">→ {s.a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="t4ju-right">
          {step >= 2 && (
            <div className="t4ju-conclusion">
              <span className="t4ju-conc-big">先定业务目标 · 再定处理策略</span>
              <span className="t4ju-conc-sub">三级训练师与初级标注员最核心的认知差距</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
