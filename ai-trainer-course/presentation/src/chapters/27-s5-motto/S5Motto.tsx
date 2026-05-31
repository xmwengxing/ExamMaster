import type { ChapterStepProps } from "../../registry/types";
import "./S5Motto.css";

export default function S5Motto({ step }: ChapterStepProps) {
  return (
    <div className="s5m-root scene-pad">
      <div className="s5m-center">
        <div className="s5m-quote">
          <span className="s5m-line">AI的尽头是业务</span>
          {step >= 0 && <span className="s5m-line s5m-accent">业务的底座是数据</span>}
        </div>
        {step >= 1 && (
          <div className="s5m-explain">
            <span className="s5m-explain-text">模型服务业务，不是刷榜单</span>
            <span className="s5m-explain-text">没有数据链路，一切都是空中楼阁</span>
          </div>
        )}
      </div>
    </div>
  );
}
