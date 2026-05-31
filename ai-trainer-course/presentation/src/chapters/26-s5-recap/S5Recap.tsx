import type { ChapterStepProps } from "../../registry/types";
import "./S5Recap.css";

const branches = [
  { label: "五齿轮闭环", sub: "需求·数据·模型·集成·迭代" },
  { label: "数据分类", sub: "结构化 · 半结构化 · 非结构化" },
  { label: "数据断点", sub: "User ID · 系统裂痕 · 数据孤岛" },
  { label: "实战找茬", sub: "输入数据源 · 反馈闭环" },
];

export default function S5Recap({ step }: ChapterStepProps) {
  return (
    <div className="s5r-root scene-pad">
      <div className="s5r-center">
        <div className="s5r-mindmap">
          <div className="s5r-center-node">
            <span className="s5r-center-text">本节回顾</span>
          </div>
          {branches.map((b, i) => (
            <div key={b.label} className="s5r-branch" style={{ animationDelay: `${i * 0.18}s` }}>
              <div className="s5r-connector" />
              <div className={`s5r-node ${i <= step ? "s5r-node-on" : "s5r-node-off"}`}>
                <span className="s5r-node-title">{b.label}</span>
                {i <= step && <span className="s5r-node-sub">{b.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
