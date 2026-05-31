import type { ChapterStepProps } from "../../registry/types";
import "./S3Pyramid.css";

const TIERS = [
  { label: "结构化", example: "订单金额 · 账户余额 · 客户年龄", size: 260 },
  { label: "半结构化", example: "JSON 日志 · XML 配置 · 日志文件", size: 360 },
  { label: "非结构化", example: "客服录音 · 长文本评价 · 图片视频", size: 480 },
];

export default function S3Pyramid({ step }: ChapterStepProps) {
  return (
    <div className="s3p-root scene-pad">
      <div className="s3p-center">
        <div className="s3p-pyramid">
          {[...TIERS].reverse().map((tier, ri) => {
            const actualIdx = TIERS.length - 1 - ri;
            return (
              <div key={tier.label}
                className={`s3p-tier ${actualIdx <= step ? "s3p-tier-on" : "s3p-tier-off"} ${actualIdx === 2 ? "s3p-tier-top" : ""}`}
                style={{ width: tier.size }}>
                <span className="s3p-tier-label">{tier.label}</span>
                {actualIdx <= step && <span className="s3p-tier-ex">{tier.example}</span>}
              </div>
            );
          })}
        </div>
        {step >= 3 && (
          <span className="s3p-tagline">
            {step >= 4 ? "越往上，你的不可替代性越高" : "三层数据构成你的完整数据世界"}
          </span>
        )}
      </div>
    </div>
  );
}
