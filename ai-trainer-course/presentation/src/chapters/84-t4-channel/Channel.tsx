import type { ChapterStepProps } from "../../registry/types";
import "./Channel.css";

export default function Channel({ step }: ChapterStepProps) {
  return (
    <div className="t4ch-root scene-pad">
      <div className="t4ch-layout">
        <div className="t4ch-left">
          <div className="t4ch-header">
            <span className="t4ch-num">属性 02</span>
            <span className="t4ch-name">声道</span>
            <span className="t4ch-unit">Channel · 单声道 vs 双声道</span>
          </div>
          <div className="t4ch-callcenter">
            <span className="t4ch-cc-title">呼叫中心典型配置</span>
            <div className="t4ch-cc-channels">
              <div className="t4ch-cc-ch">
                <span className="t4ch-cc-icon">👈</span>
                <span className="t4ch-cc-label">左声道</span>
                <span className="t4ch-cc-role">坐席</span>
              </div>
              <div className="t4ch-cc-ch">
                <span className="t4ch-cc-icon">👉</span>
                <span className="t4ch-cc-label">右声道</span>
                <span className="t4ch-cc-role">客户</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t4ch-right">
          {step >= 1 && (
            <div className="t4ch-wrong">
              <span className="t4ch-wrong-title">❌ 合成单声道 = 灾难</span>
              <span className="t4ch-wrong-desc">两人声音混合 → 标注员分不清谁在说话</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t4ch-correct">
              <span className="t4ch-correct-title">✅ 正确做法</span>
              <span className="t4ch-correct-item">1. 确认单/双声道 + 左右声源</span>
              <span className="t4ch-correct-item">2. 标注指南规定只听取某一声道</span>
              <span className="t4ch-correct-item">3. 或拆成两个独立文件分别处理</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t4ch-rule">
              <span className="t4ch-rule-text">声道搞错 = 数据管道入口就把信息组织方式搞错了</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
