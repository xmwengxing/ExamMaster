import type { ChapterStepProps } from "../../registry/types";
import "./AsrFail.css";

export default function AsrFail({ step }: ChapterStepProps) {
  return (
    <div className="t4af-root scene-pad">
      <div className="t4af-layout">
        <div className="t4af-left">
          <div className="t4af-compare">
            <span className="t4af-compare-title">ASR 识别结果对比</span>
            <div className="t4af-box t4af-box-raw">
              <span className="t4af-box-label">用户原话</span>
              <span className="t4af-box-text">俺的快递咋还没到咧？俺急用啊。</span>
            </div>
            <div className="t4af-box t4af-box-asr">
              <span className="t4af-box-label">ASR 转写结果</span>
              <span className="t4af-box-text t4af-box-err">那个案的快递炸还没到咧案案急用啊旁边有狗叫声</span>
            </div>
          </div>
        </div>
        <div className="t4af-right">
          {step >= 0 && (
            <div className="t4af-errors">
              <span className="t4af-err-title">转写错误分析</span>
              <span className="t4af-err-item">"俺" → "案""暗"（方言误识别）</span>
              <span className="t4af-err-item">"咋还没" → "炸还没"（噪音干扰）</span>
              <span className="t4af-err-item">狗叫声被当作文本转写</span>
              <span className="t4af-err-item">多出无意义的"案案"重复</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4af-impact">
              <span className="t4af-impact-big">90% → 30%</span>
              <span className="t4af-impact-text">方言+噪音下，ASR准确率断崖式下跌</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4af-insight">
              <span className="t4af-insight-text">预处理做好 → 同样的模型，识别准确率提升 20%+</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t4af-next">
              <span className="t4af-next-text">语音为什么比文本和视频更复杂？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
