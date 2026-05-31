import "./PlaybackControls.css";

interface Props {
  visible: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onFullscreen: () => void;
}

export function PlaybackControls({ visible, isPlaying, onTogglePlay, onFullscreen }: Props) {
  if (!visible) return null;

  return (
    <div className="pb-bar">
      <button className="pb-btn" onClick={onTogglePlay} data-no-advance title={isPlaying ? "暂停" : "播放"}>
        <span className="pb-icon">{isPlaying ? "⏸" : "▶"}</span>
      </button>
      <button className="pb-btn" onClick={onFullscreen} data-no-advance title="全屏">
        <span className="pb-icon">⛶</span>
      </button>
    </div>
  );
}
