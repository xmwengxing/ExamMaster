import { useState, useCallback, useMemo, useRef } from "react";
import type { ChapterStepProps } from "../../registry/types";
import "./ThreeDExplore.css";

type ColorMode = "height" | "intensity";

interface Point {
  x: number; y: number; z: number;
  heightColor: string;
  intensityColor: string;
  size: number;
}

// Generate a street scene point cloud
function generateScene(): Point[] {
  const pts: Point[] = [];
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

  // Ground surface (road + sidewalk)
  for (let i = 0; i < 100; i++) {
    const x = rand(-180, 180);
    const z = rand(-120, 120);
    let y = rand(-4, 2);
    if (Math.abs(x) < 120 && Math.abs(z) < 80) y = rand(-2, 1); // road area
    pts.push({
      x, y: y, z,
      heightColor: y < -1 ? "#4a9eff" : "#7ab648",
      intensityColor: "#2a2a30",
      size: rand(2, 5),
    });
  }

  // Building (left side) - dense wall
  for (let i = 0; i < 40; i++) {
    const x = rand(-180, -100);
    const y = rand(-3, 80);
    const z = rand(-100, 100);
    pts.push({
      x, y, z,
      heightColor: y > 30 ? "#ff6b4a" : y > 10 ? "#ffb347" : "#7ab648",
      intensityColor: "#2a2a30",
      size: rand(3, 7),
    });
  }

  // Vehicles (right-center) - dense clusters at varying reflectivity
  const vehicles = [
    { cx: 80, cz: -30, color: "dark" },
    { cx: 90, cz: 30, color: "bright" },
    { cx: -30, cz: -60, color: "dark" },
    { cx: -40, cz: 50, color: "bright" },
  ];
  for (const v of vehicles) {
    for (let i = 0; i < 25; i++) {
      const x = rand(v.cx - 18, v.cx + 18);
      const y = rand(0, 18);
      const z = rand(v.cz - 12, v.cz + 12);
      pts.push({
        x, y, z,
        heightColor: y > 10 ? "#ffb347" : "#7ab648",
        intensityColor: v.color === "dark" ? "#1a1a22" : "#aacc44",
        size: rand(3, 8),
      });
    }
  }

  // Traffic sign (far center-left) - high reflectivity
  for (let i = 0; i < 15; i++) {
    pts.push({
      x: rand(-30, -10),
      y: rand(30, 55),
      z: rand(-80, -60),
      heightColor: "#ff6b4a",
      intensityColor: "#facc15",
      size: rand(4, 9),
    });
  }

  // Scattered fence/pole points
  for (let i = 0; i < 20; i++) {
    pts.push({
      x: rand(-160, 160),
      y: rand(20, 60),
      z: rand(-100, 100),
      heightColor: "#ffb347",
      intensityColor: "#3a3a3a",
      size: rand(2, 5),
    });
  }

  return pts;
}

export default function ThreeDExplore({ step }: ChapterStepProps) {
  const [colorMode, setColorMode] = useState<ColorMode>("height");
  const [rotation, setRotation] = useState({ x: -25, y: 15 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => generateScene(), []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRotation(prev => ({
      x: Math.max(-60, Math.min(30, prev.x + dy * 0.4)),
      y: prev.y + dx * 0.4,
    }));
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  const getColor = useCallback((p: Point) => {
    if (colorMode === "height") return p.heightColor;
    return p.intensityColor;
  }, [colorMode]);

  return (
    <div className="t5e-root scene-pad">
      <div className="t5e-layout">
        <div className="t5e-hint">
          {step <= 1 ? (
            <span className="t5e-hint-text">🖱️ 按住鼠标拖拽旋转三维场景</span>
          ) : step <= 4 ? (
            <span className="t5e-hint-text">
              {step <= 2 ? "按高度着色 — 蓝色地面 / 绿色车辆 / 红色高处" : "按反射率着色 — 注意深色车辆的亮度变化"}
            </span>
          ) : (
            <span className="t5e-hint-text">两种着色交叉验证 = 减少漏检误检</span>
          )}
        </div>
        <div
          ref={containerRef}
          className="t5e-scene"
          style={{ perspective: "800px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            className="t5e-cloud"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              cursor: dragging ? "grabbing" : "grab",
            }}
          >
            {points.map((p, i) => (
              <div
                key={i}
                className={`t5e-dot ${hovered === i ? "t5e-dot-hovered" : ""}`}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                style={{
                  transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px)`,
                  background: getColor(p),
                  width: p.size,
                  height: p.size,
                  opacity: hovered === i ? 1 : dragging ? 0.5 : 0.75,
                  boxShadow: hovered === i ? `0 0 12px ${getColor(p)}` : undefined,
                }}
              />
            ))}
          </div>
        </div>
        {step >= 2 && (
          <div className="t5e-controls">
            <button
              className={`t5e-ctrl-btn ${colorMode === "height" ? "t5e-ctrl-active" : ""}`}
              onClick={() => setColorMode("height")}
              data-no-advance
            >
              <span className="t5e-ctrl-dot" style={{background:"linear-gradient(180deg,#4a9eff,#7ab648,#ffb347,#ff6b4a)"}}/>
              按高度
            </button>
            <button
              className={`t5e-ctrl-btn ${colorMode === "intensity" ? "t5e-ctrl-active" : ""}`}
              onClick={() => setColorMode("intensity")}
              data-no-advance
            >
              <span className="t5e-ctrl-dot" style={{background:"linear-gradient(180deg,#1a1a22,#4a4a4a,#aacc44,#facc15)"}}/>
              按反射率
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
