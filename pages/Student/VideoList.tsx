
import React from 'react';
import { VideoConfig } from '../../types';

interface VideoListProps {
  videos: VideoConfig[];
  onBack: () => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">精选视频课</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
          >
            <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
              <img 
                src={`https://picsum.photos/seed/${video.id}/400/225`} 
                alt={video.title} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform cursor-pointer shadow-2xl">
                  <i className="fa-solid fa-play ml-1"></i>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                  {video.type === 'LINK' ? '外部课' : '平台课'}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {video.title}
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-6 line-clamp-2 leading-relaxed">
                {video.desc}
              </p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                     <i className="fa-solid fa-chalkboard-user text-xs"></i>
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">官方精选</span>
                </div>
                <button 
                  onClick={() => window.open(video.url, '_blank')}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group/btn"
                >
                  立即观看 <i className="fa-solid fa-circle-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="py-20 text-center text-gray-400">
           <i className="fa-solid fa-video-slash text-5xl mb-4 opacity-20"></i>
           <p className="font-bold">暂无精选视频课程</p>
        </div>
      )}
    </div>
  );
};

export default VideoList;
