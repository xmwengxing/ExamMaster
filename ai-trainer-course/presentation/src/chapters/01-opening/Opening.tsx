import type { ChapterStepProps } from "../../registry/types";
import "./Opening.css";

export default function Opening({ step }: ChapterStepProps) {
  return (
    <div className="op-root scene-pad">
      <div className="op-center">
        {step === 0 && (
          <div className="op-hero">
            <span className="op-title">人工智能训练师</span>
            <div className="op-dashed" />
            <span className="op-level">三级</span>
          </div>
        )}
        {step === 1 && (
          <div className="op-hero">
            <span className="op-title">人工智能训练师</span>
            <div className="op-dashed" />
            <span className="op-level">三级</span>
            <span className="op-instructor">翁老师</span>
          </div>
        )}
        {step === 2 && (
          <div className="op-full">
            <div className="op-hero">
              <span className="op-title">人工智能训练师</span>
              <div className="op-dashed" />
              <span className="op-level">三级</span>
              <span className="op-instructor">翁老师</span>
            </div>
            <div className="op-welcome">
              <span className="op-welcome-text">欢迎来到人工智能训练师三级的课堂</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
