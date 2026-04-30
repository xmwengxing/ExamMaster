
import React, { useState, useEffect, useRef } from 'react';
import { VideoConfig, BannerItem } from '../../types';
import { useAppStore } from '../../store';
import RichTextEditor from '../../components/RichTextEditor';

interface ContentManagerProps {
  config: any;
  onUpdate: (data: any) => void;
}

const defaultForm = { announcement: '', banners: [] as any[], videos: [] as any[] };

const ContentManager: React.FC<ContentManagerProps> = ({ config, onUpdate }) => {
  const store = useAppStore();
  const [form, setForm] = useState<any>(config || defaultForm);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(config || defaultForm);
  }, [config]);

  const handleUpdate = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const ok = await onUpdate(form);
      if (ok === false) throw new Error('保存失败');
      setSaveMessage('保存成功');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('保存失败，请检查日志');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (listName: 'banners' | 'videos') => {
    const newItem = listName === 'banners'
      ? {
          id: 'b-' + Date.now(),
          image: 'https://picsum.photos/1200/400',
          content: '新横幅标题/摘要',
          detailContent: '在此处输入横幅点击后的详细介绍内容...'
        }
      : {
          id: 'v-' + Date.now(),
          title: '新课程视频',
          desc: '课程简介描述',
          type: 'LINK' as const,
          url: 'https://v.qq.com'
        };

    setForm(prev => ({ ...(prev || defaultForm), [listName]: [...((prev?.[listName] || [])), newItem] }));
  };

  const removeItem = (listName: 'banners' | 'videos', id: string) => {
    setForm(prev => ({ ...(prev || defaultForm), [listName]: (prev?.[listName] || []).filter((x: any) => x.id !== id) }));
  };

  const updateItemField = (listName: 'banners' | 'videos', id: string, field: string, val: any) => {
    setForm(prev => ({
      ...(prev || defaultForm),
      [listName]: (prev?.[listName] || []).map((x: any) => x.id === id ? { ...x, [field]: val } : x)
    }));
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateItemField('banners', id, 'image', base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">内容管理</h2>
          <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">管理首页公告、轮播横幅与精选课程视频</p>
        </div>
        <div className="flex items-center gap-4">
          <button disabled={saving} onClick={handleUpdate} className={`bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {saving ? '保存中...' : '保存所有配置'}
          </button>
          {saveMessage && <div className="text-sm font-bold text-indigo-600">{saveMessage}</div>}
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-300">
              {/* 公告栏设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-bullhorn text-amber-500"></i> 首页滚动公告
            </h3>
            
            {/* 公告内容 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">公告内容</label>
              <textarea 
                className="w-full bg-amber-50 rounded-2xl p-5 font-bold text-amber-700 h-24 outline-none border-2 border-transparent focus:border-amber-200 transition-all" 
                value={form?.announcement || ''} 
                placeholder="请输入将在学员端首页展示的通知公告内容..."
                onChange={e => setForm(prev => ({ ...(prev || defaultForm), announcement: e.target.value }))} 
              />
            </div>

            {/* 滚动速度设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">滚动时间（秒）</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="0"
                    max="120"
                    className="flex-1 bg-amber-50 rounded-xl px-4 py-3 font-bold text-amber-700 outline-none border-2 border-transparent focus:border-amber-200 transition-all" 
                    value={form?.announcementDuration ?? 20} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setForm(prev => ({ 
                        ...(prev || defaultForm), 
                        announcementDuration: isNaN(val) ? 20 : Math.max(0, Math.min(120, val))
                      }));
                    }} 
                  />
                  <span className="text-sm font-bold text-gray-400">秒</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                  公告滚动一次所需的时间，范围：0-120秒<br/>
                  <span className="text-rose-600 font-bold">设置为 0 秒将禁止滚动（静态显示）</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">滚动速度预设</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...(prev || defaultForm), announcementDuration: 0 }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                      (form?.announcementDuration ?? 20) === 0
                        ? 'bg-gray-500 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    禁用
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...(prev || defaultForm), announcementDuration: 10 }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                      (form?.announcementDuration ?? 20) === 10
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    快速
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...(prev || defaultForm), announcementDuration: 20 }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                      (form?.announcementDuration ?? 20) === 20
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    标准
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...(prev || defaultForm), announcementDuration: 40 }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                      (form?.announcementDuration ?? 20) === 40
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    缓慢
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                  禁用0秒 / 快速10秒 / 标准20秒 / 缓慢40秒
                </p>
              </div>
            </div>

            {/* 预览效果 */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-eye"></i> 预览效果
                {(form?.announcementDuration ?? 20) === 0 && (
                  <span className="text-[10px] bg-gray-500 text-white px-2 py-0.5 rounded-full">静态显示</span>
                )}
              </p>
              <div className="bg-white rounded-xl p-3 overflow-hidden relative">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-bullhorn shrink-0 text-amber-500"></i>
                  {(form?.announcementDuration ?? 20) === 0 ? (
                    <div className="flex-1 font-black text-xs text-amber-600 truncate">
                      {form?.announcement || '请输入公告内容...'}
                    </div>
                  ) : (
                    <div 
                      className="flex-1 overflow-hidden font-black text-xs text-amber-600"
                      style={{
                        animation: `marquee ${form?.announcementDuration || 20}s linear infinite`
                      }}
                    >
                      <span className="inline-block whitespace-nowrap pr-[100%]">
                        {form?.announcement || '请输入公告内容...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

              {/* 横幅管理 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-image text-indigo-500"></i> 首页轮播横幅 (Banners)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold">支持本地上传及详情内容编辑</p>
              </div>
              <button onClick={() => addItem('banners')} className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">
                <i className="fa-solid fa-plus mr-1"></i> 新增横幅
              </button>
            </div>
            
            <div className="space-y-6">
              {(form?.banners || []).map((banner: any) => (
                <div key={banner.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6 relative group transition-all hover:bg-white hover:shadow-md">
                  <button 
                    onClick={() => removeItem('banners', banner.id)} 
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-rose-300 hover:text-rose-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="删除此横幅"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 space-y-3">
                      <div className="aspect-[3/1] md:aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-gray-200 relative group/img">
                        {banner.image ? (
                          <img src={banner.image} className="w-full h-full object-cover" alt="Banner Preview" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-black">无图片</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg">
                            更换图片
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleBannerImageUpload(e, banner.id)} 
                            />
                          </label>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold text-center italic">推荐比例 3:1 (1200x400)</div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">横幅标题/摘要 (首页展示)</label>
                        <input 
                          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100" 
                          value={banner.content} 
                          onChange={e => updateItemField('banners', banner.id, 'content', e.target.value)}
                          placeholder="例如：EduMaster 全新架构上线" 
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          详情页详细内容 (点击后展示) - 富文本编辑
                        </label>
                        <RichTextEditor
                          value={banner.detailContent || ''}
                          onChange={(value) => updateItemField('banners', banner.id, 'detailContent', value)}
                          placeholder="输入学员点击横幅后能看到的详细内容，支持富文本格式、图片插入等..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!form.banners || form.banners.length === 0) && (
                <div className="py-12 text-center text-gray-300 border-2 border-dashed border-gray-50 rounded-3xl">
                  <i className="fa-solid fa-images text-4xl mb-2 opacity-20"></i>
                  <p className="text-xs font-bold">暂无首页横幅，请点击右上角添加</p>
                </div>
              )}
            </div>
          </div>

          {/* 视频课程管理 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-film text-purple-500"></i> 精选课程视频
              </h3>
              <button onClick={() => addItem('videos')} className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl hover:bg-purple-100">新增课程</button>
            </div>
            
            {/* 视频类型说明 */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-circle-info text-purple-600 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-xs text-purple-700 font-bold mb-2">支持的视频类型</p>
                  <ul className="text-[10px] text-purple-600 font-medium space-y-1 leading-relaxed">
                    <li>• <strong>直接视频文件</strong>：.mp4、.webm、.ogg、.m3u8 格式，使用内建播放器</li>
                    <li>• <strong>嵌入式视频</strong>：YouTube、Bilibili、爱奇艺、腾讯视频等，自动嵌入播放</li>
                    <li>• <strong>API接口</strong>：选择"API"类型，支持带token等参数的接口地址</li>
                    <li>• <strong>外部链接</strong>：其他类型链接将在新窗口打开</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.videos?.map((video: any) => (
                <div key={video.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                  <button onClick={() => removeItem('videos', video.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                  
                  {/* 视频类型选择 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">视频类型</label>
                    <select
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold"
                      value={video.type || 'LINK'}
                      onChange={e => updateItemField('videos', video.id, 'type', e.target.value)}
                    >
                      <option value="LINK">普通链接</option>
                      <option value="API">API接口</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">课程标题</label>
                    <input 
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold" 
                      value={video.title} 
                      onChange={e => updateItemField('videos', video.id, 'title', e.target.value)}
                      placeholder="例如：Python基础入门"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {video.type === 'API' ? 'API接口地址' : '视频链接'}
                    </label>
                    <input 
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-mono" 
                      value={video.url} 
                      onChange={e => updateItemField('videos', video.id, 'url', e.target.value)}
                      placeholder={video.type === 'API' ? 'https://api.example.com/video?token=xxx' : 'https://www.youtube.com/watch?v=xxx'}
                    />
                    {video.type === 'API' && (
                      <p className="text-[9px] text-gray-400 mt-1">
                        <i className="fa-solid fa-lightbulb mr-1"></i>
                        可包含token等认证参数，系统会直接使用此URL
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">简介描述</label>
                    <input 
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs" 
                      value={video.desc} 
                      onChange={e => updateItemField('videos', video.id, 'desc', e.target.value)}
                      placeholder="课程简介，帮助学员了解课程内容"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 题目字体样式设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-font text-teal-500"></i> 题目字体样式
            </h3>
            <p className="text-xs text-gray-400 font-medium">自定义题干和题目内容的字体显示效果</p>

            <div className="space-y-6">
              {/* 字体大小 */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">字体大小</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="12" 
                    max="24" 
                    step="1"
                    value={form?.questionFontSize || 16}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), questionFontSize: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <span className="text-sm font-black text-teal-600 min-w-[60px] text-right">{form?.questionFontSize || 16}px</span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                  <span>12px 小号</span>
                  <span>16px 标准</span>
                  <span>24px 大号</span>
                </div>
              </div>

              {/* 字体样式 */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">字体样式</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-teal-50 hover:border-teal-100 transition-all">
                    <input 
                      type="checkbox" 
                      checked={form?.questionFontBold !== false}
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), questionFontBold: e.target.checked }))}
                      className="w-5 h-5 rounded accent-teal-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fa-solid fa-bold text-teal-500"></i>
                        <span className="font-bold text-gray-800">加粗</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">题干文字加粗显示</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-teal-50 hover:border-teal-100 transition-all">
                    <input 
                      type="checkbox" 
                      checked={form?.questionFontItalic === true}
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), questionFontItalic: e.target.checked }))}
                      className="w-5 h-5 rounded accent-teal-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fa-solid fa-italic text-teal-500"></i>
                        <span className="font-bold text-gray-800">倾斜</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">题干文字倾斜显示</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 预览效果 */}
              <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                <p className="text-xs font-bold text-teal-700 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-eye"></i> 预览效果
                </p>
                <div className="bg-white rounded-xl p-6">
                  <div 
                    className="text-gray-800"
                    style={{
                      fontSize: `${form?.questionFontSize || 16}px`,
                      fontWeight: form?.questionFontBold !== false ? 'bold' : 'normal',
                      fontStyle: form?.questionFontItalic === true ? 'italic' : 'normal'
                    }}
                  >
                    这是题目内容的预览效果，您可以调整字体大小、加粗和倾斜样式。
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 font-bold mb-1">使用说明</p>
                    <ul className="text-[10px] text-blue-600 font-medium space-y-1 leading-relaxed">
                      <li>• 字体设置将应用到所有题目的题干和内容</li>
                      <li>• 建议字体大小设置在 14-18px 之间，便于阅读</li>
                      <li>• 加粗可以让题目更醒目，但不建议同时使用加粗和倾斜</li>
                      <li>• 修改后需要刷新做题页面才能看到效果</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 多语言配置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-language text-teal-500"></i> 多语言设置
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">配置系统支持的语言（功能预留）</p>
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200">即将推出</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">默认语言</label>
                <select 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-teal-200 transition-all"
                  value={form?.defaultLanguage || 'zh-CN'}
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), defaultLanguage: e.target.value }))}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                  <option value="ko-KR">한국어</option>
                </select>
              </div>
              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-circle-info text-teal-400 mt-0.5"></i>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-teal-700 font-bold">功能说明</p>
                    <p className="text-[10px] text-teal-600 font-medium leading-relaxed">
                      多语言功能正在开发中，当前版本仅支持简体中文。未来版本将支持界面语言切换、题目多语言版本等功能。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ContentManager;
