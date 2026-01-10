import React, { useState, useRef, useEffect } from 'react';
import { VideoConfig } from '../types';

interface VideoPlayerProps {
  video: VideoConfig;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 判断是否为直接视频链接（mp4, webm, ogg等）
  const isDirectVideo = () => {
    const url = video.url.toLowerCase();
    return url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.ogg') ||
           url.endsWith('.m3u8');
  };

  // 判断是否为嵌入式视频（YouTube, Bilibili等）
  const isEmbeddableVideo = () => {
    const url = video.url.toLowerCase();
    return url.includes('youtube.com') || 
           url.includes('youtu.be') ||
           url.includes('bilibili.com') ||
           url.includes('iqiyi.com') ||
           url.includes('qq.com/v');
  };

  // 获取嵌入式URL
  const getEmbedUrl = () => {
    const url = video.url;
    
    // YouTube
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Bilibili
    if (url.includes('bilibili.com/video/')) {
      const bvid = url.match(/video\/(BV\w+)/)?.[1];
      return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1`;
    }
    
    // 其他平台直接返回原URL
    return url;
  };

  // 处理API类型视频
  const getApiVideoUrl = () => {
    if (video.type === 'API') {
      // 如果URL已经包含完整的API地址，直接使用
      return video.url;
    }
    return video.url;
  };

  const handleVideoError = () => {
    setError('视频加载失败，请检查视频链接是否有效');
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // 渲染视频播放器
  const renderPlayer = () => {
    // 直接视频文件
    if (isDirectVideo()) {
      return (
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          <source src={getApiVideoUrl()} type="video/mp4" />
          您的浏览器不支持视频播放
        </video>
      );
    }
    
    // 嵌入式视频
    if (isEmbeddableVideo()) {
      return (
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleVideoLoad}
          onError={handleVideoError}
        />
      );
    }
    
    // 其他类型，使用iframe尝试加载
    return (
      <iframe
        ref={iframeRef}
        src={getApiVideoUrl()}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleVideoLoad}
        onError={handleVideoError}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-10"
      >
        <i className="fa-solid fa-xmark text-xl"></i>
      </button>

      {/* 视频信息 */}
      <div className="absolute top-6 left-6 z-10 max-w-md">
        <h2 className="text-white text-xl font-bold mb-2">{video.title}</h2>
        <p className="text-white/70 text-sm">{video.desc}</p>
      </div>

      {/* 播放器容器 */}
      <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold">加载中...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <i className="fa-solid fa-circle-exclamation text-5xl text-red-500 mb-4"></i>
            <p className="text-white font-bold mb-2">{error}</p>
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
            >
              <i className="fa-solid fa-external-link-alt mr-2"></i>
              在新窗口打开
            </button>
          </div>
        )}

        {!error && renderPlayer()}
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">
        按 ESC 键退出全屏播放
      </div>
    </div>
  );
};

export default VideoPlayer;
