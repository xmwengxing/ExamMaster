import type { ChapterStepProps } from "../../registry/types";
import "./Sop.css";

const MODULES = [
  { num: "01", title: "抽帧策略定义", desc: "场景运动特征 + 关键帧占比预估值 + 选定策略" },
  { num: "02", title: "触发条件设定", desc: "信号源类型 + 触发帧率 + 停止条件" },
  { num: "03", title: "遮挡处理规则", desc: "时间阈值 + 特征比对清单 + 虚拟预测框" },
];

export default function Sop({ step }: ChapterStepProps) {
  return (
    <div className="t3sp-root scene-pad">
      <div className="t3sp-layout">
        <div className="t3sp-left">
          <span className="t3sp-title">通关考核 · SOP模板</span>
          <div className="t3sp-doc">
            <span className="t3sp-doc-name">📄 视频数据处理SOP模板</span>
            <div className="t3sp-sections">
              {MODULES.map((m, i) => (
                <div key={m.num} className={`t3sp-sec ${i <= step - 1 ? "t3sp-sec-on" : "t3sp-sec-off"}`}>
                  <span className="t3sp-sec-num">{m.num}</span>
                  <div className="t3sp-sec-body">
                    <span className="t3sp-sec-title">{m.title}</span>
                    <span className="t3sp-sec-desc">{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="t3sp-right">
          {step >= 0 && (
            <div className="t3sp-criteria">
              <span className="t3sp-cr-title">评审标准</span>
              <span className="t3sp-cr-item">1. 策略选择与场景特征挂钩（非套模板）</span>
              <span className="t3sp-cr-item">2. 规则定义具体到标注员可执行（非笼统套话）</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
