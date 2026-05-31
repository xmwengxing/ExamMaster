
import React from 'react';
import { BannerItem } from '../../types';

interface BannerDetailProps {
  banner: BannerItem;
  onBack: () => void;
}

const BannerDetail: React.FC<BannerDetailProps> = ({ banner, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 px-2">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 shadow-sm active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-black text-gray-900 truncate flex-1">通知详情</h2>
      </div>

      {/* 横幅大图 */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
        {banner.image ? (
          <img 
            src={banner.image} 
            className="w-full aspect-[21/9] md:aspect-[3/1] object-cover" 
            alt="Banner Cover" 
          />
        ) : (
          <div className="w-full aspect-[21/9] md:aspect-[3/1] bg-gray-100 flex items-center justify-center text-gray-400 font-black">无封面图片</div>
        )}
        
        <div className="p-8 md:p-12 space-y-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {banner.content}
          </h1>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
            <i className="fa-solid fa-calendar-day"></i> 发布于 {new Date().toLocaleDateString()}
          </div>

          <div className="w-full h-px bg-gray-100 border-dashed border-t"></div>

          {/* 正文内容 - 支持富文本 HTML */}
          <div 
            className="rich-text-content prose prose-indigo max-w-none text-gray-600 font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: banner.detailContent || '<p class="text-gray-400 italic">暂无详细说明</p>' 
            }}
          />

          <style>{`
            .rich-text-content img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              margin: 16px 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .rich-text-content ul, .rich-text-content ol {
              padding-left: 24px;
              margin: 12px 0;
            }
            .rich-text-content li {
              margin: 6px 0;
            }
            .rich-text-content p {
              margin: 12px 0;
            }
            .rich-text-content strong {
              font-weight: 700;
              color: #1f2937;
            }
            .rich-text-content a {
              color: #4f46e5;
              text-decoration: underline;
            }
            .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 {
              font-weight: 800;
              color: #111827;
              margin: 20px 0 12px 0;
            }
          `}</style>
        </div>
      </div>

      {/* 底部操作提示 */}
      <div className="text-center py-8">
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black active:scale-95 transition-all"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default BannerDetail;
