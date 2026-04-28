
import React, { useState, useEffect, useRef } from 'react';
import { VideoConfig, BannerItem } from '../../types';
import { useAppStore } from '../../store';
import RichTextEditor from '../../components/RichTextEditor';
import CacheManager from '../../components/CacheManager';

interface SystemSettingsProps {
  config: any;
  onUpdate: (data: any) => void;
  onChangeAdminPass: (old: string, newP: string) => Promise<boolean>;
}

const defaultForm = { announcement: '', banners: [] as any[], videos: [] as any[] };

const SystemSettings: React.FC<SystemSettingsProps> = ({ config, onUpdate, onChangeAdminPass }) => {
  const store = useAppStore();
  const [form, setForm] = useState<any>(config || defaultForm);
  const [passForm, setPassForm] = useState({ old: '', newP: '', confirm: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'theme' | 'content' | 'security' | 'ai' | 'cache'>('theme');

  useEffect(() => {
    setForm(config || defaultForm);
  }, [config]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">系统管理中心</h2>
          <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Global Configuration & UI Management</p>
        </div>
        <div className="flex items-center gap-4">
          <button disabled={saving} onClick={handleUpdate} className={`bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {saving ? '保存中...' : '保存所有配置'}
          </button>
          {saveMessage && <div className="text-sm font-bold text-indigo-600">{saveMessage}</div>}
        </div>
      </div>

      {/* 分类导航按钮 */}
      <div className="bg-white p-2 rounded-3xl border shadow-sm flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveCategory('theme')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
            activeCategory === 'theme'
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200'
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-palette"></i>
          主题定制
        </button>
        <button
          onClick={() => setActiveCategory('content')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
            activeCategory === 'content'
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-layer-group"></i>
          内容管理
        </button>
        <button
          onClick={() => setActiveCategory('security')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
            activeCategory === 'security'
              ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-200'
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-shield-halved"></i>
          系统安全
        </button>
        <button
          onClick={() => setActiveCategory('ai')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
            activeCategory === 'ai'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200'
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-brain"></i>
          智能化
        </button>
        <button
          onClick={() => setActiveCategory('cache')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
            activeCategory === 'cache'
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200'
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-database"></i>
          缓存管理
        </button>
      </div>

      {/* 主题定制 */}
      {activeCategory === 'theme' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* 页面标题设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-window-maximize text-purple-500"></i> 页面标签标题
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">浏览器标签页显示的标题</label>
              <input 
                className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-purple-200 transition-all" 
                value={form?.pageTitle || 'EduMaster - 刷题与模拟考试系统'} 
                placeholder="EduMaster - 刷题与模拟考试系统"
                onChange={e => setForm(prev => ({ ...(prev || defaultForm), pageTitle: e.target.value }))} 
              />
              <p className="text-[10px] text-gray-400 font-medium italic ml-1">修改后需要刷新页面才能看到效果</p>
            </div>
          </div>

          {/* Logo 设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-image-portrait text-indigo-500"></i> Logo 标识
            </h3>
            
            <div className="space-y-6">
              {/* Logo 类型选择 */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo 类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    !form?.logoImage ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="logoType"
                      checked={!form?.logoImage}
                      onChange={() => setForm(prev => ({ ...(prev || defaultForm), logoImage: '' }))}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-gray-800 text-sm">图标 + 文字</div>
                      <div className="text-[10px] text-gray-400 font-medium">使用 Font Awesome 图标</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    form?.logoImage ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="logoType"
                      checked={!!form?.logoImage}
                      onChange={() => setForm(prev => ({ ...(prev || defaultForm), logoImage: 'placeholder' }))}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-gray-800 text-sm">上传图片</div>
                      <div className="text-[10px] text-gray-400 font-medium">自定义 Logo 图片</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 图标 + 文字模式 */}
              {!form?.logoImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo 图标 (Font Awesome)</label>
                    <input 
                      className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-indigo-200 transition-all" 
                      value={form?.logoIcon || 'fa-graduation-cap'} 
                      placeholder="fa-graduation-cap"
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), logoIcon: e.target.value }))} 
                    />
                    <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                      使用 Font Awesome 图标类名，如：fa-graduation-cap, fa-book, fa-school
                      <a href="https://fontawesome.com/icons" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">
                        查看图标库 <i className="fa-solid fa-external-link-alt text-[8px]"></i>
                      </a>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo 文字</label>
                    <input 
                      className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-indigo-200 transition-all" 
                      value={form?.logoText || 'EduMaster'} 
                      placeholder="EduMaster"
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), logoText: e.target.value }))} 
                    />
                  </div>
                </div>
              )}

              {/* 图片上传模式 */}
              {!!form?.logoImage && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* 图片预览 */}
                    <div className="w-32 h-32 bg-gray-100 rounded-2xl border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                      {form.logoImage ? (
                        <img src={form.logoImage} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <i className="fa-solid fa-image text-3xl mb-2"></i>
                          <p className="text-[10px] font-bold">未上传</p>
                        </div>
                      )}
                    </div>

                    {/* 上传按钮和说明 */}
                    <div className="flex-1 space-y-3">
                      <label className="block">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // 检查文件大小（限制 2MB）
                            if (file.size > 2 * 1024 * 1024) {
                              alert('图片大小不能超过 2MB');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                // 创建 canvas 进行缩放
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                
                                // 目标尺寸（最大 200x200）
                                let width = img.width;
                                let height = img.height;
                                const maxSize = 200;
                                
                                if (width > maxSize || height > maxSize) {
                                  if (width > height) {
                                    height = (height / width) * maxSize;
                                    width = maxSize;
                                  } else {
                                    width = (width / height) * maxSize;
                                    height = maxSize;
                                  }
                                }
                                
                                canvas.width = width;
                                canvas.height = height;
                                ctx?.drawImage(img, 0, 0, width, height);
                                
                                // 转换为 Base64
                                const base64 = canvas.toDataURL('image/png', 0.9);
                                setForm(prev => ({ ...(prev || defaultForm), logoImage: base64 }));
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <span className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-black cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                          <i className="fa-solid fa-upload mr-2"></i>
                          选择图片
                        </span>
                      </label>

                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <p className="text-[10px] text-blue-700 font-bold mb-1">
                          <i className="fa-solid fa-circle-info mr-1"></i>
                          图片规格要求
                        </p>
                        <ul className="text-[9px] text-blue-600 font-medium space-y-0.5 leading-relaxed">
                          <li>• 推荐尺寸：200x200 像素（正方形）</li>
                          <li>• 支持格式：PNG、JPG、GIF、SVG</li>
                          <li>• 文件大小：不超过 2MB</li>
                          <li>• 图片会自动缩放至合适尺寸</li>
                          <li>• 建议使用透明背景的 PNG 格式</li>
                        </ul>
                      </div>

                      {form.logoImage && (
                        <button
                          onClick={() => setForm(prev => ({ ...(prev || defaultForm), logoImage: '' }))}
                          className="text-xs font-black text-rose-600 hover:underline"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i>
                          删除图片
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logo 文字（可选） */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo 文字（可选）</label>
                    <input 
                      className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-indigo-200 transition-all" 
                      value={form?.logoText || ''} 
                      placeholder="留空则只显示图片"
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), logoText: e.target.value }))} 
                    />
                    <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                      可以在图片旁边显示文字，留空则只显示图片
                    </p>
                  </div>
                </div>
              )}

              {/* 预览效果 */}
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-700 mb-3">预览效果</p>
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl">
                  {form?.logoImage ? (
                    <>
                      <img src={form.logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                      {form?.logoText && (
                        <span className="font-bold text-xl tracking-tight">{form.logoText}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <i className={`fa-solid ${form?.logoIcon || 'fa-graduation-cap'} text-white text-xl`}></i>
                      </div>
                      <span className="font-bold text-xl tracking-tight">{form?.logoText || 'EduMaster'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 登录页文案设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-quote-left text-emerald-500"></i> 登录页文案
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PC 端大标题</label>
                <input 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-emerald-200 transition-all" 
                  value={form?.loginTitle || ''} 
                  placeholder="留空则使用 Logo 文字"
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), loginTitle: e.target.value }))} 
                />
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">
                  显示在 PC 端登录页左侧大屏顶部（大号字体）<br/>
                  <span className="text-emerald-600 font-bold">留空则自动使用"Logo 文字"的内容</span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PC 端副标题（标语）</label>
                <input 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-emerald-200 transition-all" 
                  value={form?.loginSlogan || '一站式智能学习与模拟考试管理平台'} 
                  placeholder="一站式智能学习与模拟考试管理平台"
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), loginSlogan: e.target.value }))} 
                />
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">显示在 PC 端登录页左侧大屏，标题下方</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">移动端标语</label>
                <input 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-emerald-200 transition-all" 
                  value={form?.loginSloganMobile || '智能学习，轻松备考'} 
                  placeholder="智能学习，轻松备考"
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), loginSloganMobile: e.target.value }))} 
                />
                <p className="text-[10px] text-gray-400 font-medium italic ml-1">显示在移动端登录框上方</p>
              </div>
            </div>

            {/* 预览效果 */}
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 mb-3">PC 端预览效果</p>
              <div className="bg-indigo-600 p-6 rounded-xl text-white">
                <h1 className="text-4xl font-black mb-3 tracking-tight">
                  {form?.loginTitle || form?.logoText || 'EduMaster'}
                </h1>
                <p className="text-lg text-indigo-100 font-light leading-relaxed">
                  {form?.loginSlogan || '一站式智能学习与模拟考试管理平台'}
                </p>
              </div>
            </div>
          </div>

          {/* 学员首页布局配置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-table-cells-large text-blue-500"></i> 学员首页布局
            </h3>
            <p className="text-xs text-gray-400 font-medium">自定义学员首页显示的功能模块</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'showBanner', label: '轮播横幅', icon: 'fa-image', desc: '首页顶部轮播图' },
                { key: 'showAnnouncement', label: '滚动公告', icon: 'fa-bullhorn', desc: '系统通知公告栏' },
                { key: 'showProfile', label: '个人资料卡', icon: 'fa-user', desc: '用户信息展示' },
                { key: 'showDailyGoal', label: '每日目标', icon: 'fa-target', desc: '学习进度追踪' },
                { key: 'showQuickActions', label: '快捷操作', icon: 'fa-bolt', desc: '练习模式入口' },
                { key: 'showStats', label: '学习统计', icon: 'fa-chart-line', desc: '数据统计面板' },
              ].map(module => (
                <label key={module.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                  <input 
                    type="checkbox" 
                    checked={form?.homeLayout?.[module.key] !== false}
                    onChange={e => setForm(prev => ({
                      ...(prev || defaultForm),
                      homeLayout: {
                        ...(prev?.homeLayout || {}),
                        [module.key]: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 rounded accent-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`fa-solid ${module.icon} text-indigo-500 group-hover:text-indigo-600`}></i>
                      <span className="font-bold text-gray-800">{module.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{module.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 内容管理 */}
      {activeCategory === 'content' && (
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
                    // 禁用滚动时，静态显示
                    <div className="flex-1 font-black text-xs text-amber-600 truncate">
                      {form?.announcement || '请输入公告内容...'}
                    </div>
                  ) : (
                    // 启用滚动时，动画显示
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
      )}

      {/* 系统安全 */}
      {activeCategory === 'security' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* 数据维护专区 */}
          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-dashed border-indigo-50 space-y-6">
            <h3 className="font-black text-lg flex items-center gap-2 text-indigo-600">
              <i className="fa-solid fa-server"></i> 数据维护与灾备
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              支持全量数据备份和题库独立备份，建议定期导出存档以防数据丢失。
            </p>
            
            {/* 全量备份 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-database text-indigo-500 text-sm"></i>
                <span className="font-bold text-gray-800 text-sm">全量数据备份</span>
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">JSON 格式</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed ml-6">
                包含所有学员信息、题库、题目、考试记录、练习进度等完整数据，适合系统迁移或完整恢复。
              </p>
              <div className="flex gap-4 ml-6">
                <button onClick={store.exportData} className="flex-1 bg-white border-2 border-indigo-100 text-indigo-600 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                  <i className="fa-solid fa-file-export"></i> 导出完整备份
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex-1 bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black hover:bg-indigo-100 transition-all flex items-center justify-center gap-3">
                  <i className="fa-solid fa-file-import"></i> 恢复数据存档
                  <input type="file" ref={fileRef} className="hidden" accept=".json" onChange={e => e.target.files?.[0] && store.importData(e.target.files[0])} />
                </button>
              </div>
            </div>

            {/* 题库独立备份 */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-book text-green-500 text-sm"></i>
                <span className="font-bold text-gray-800 text-sm">题库独立备份</span>
                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full">SQL 格式</span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">推荐</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed ml-6">
                单独导出题库数据（包括题目、图片、标签），支持跨系统导入，适合题库备份和迁移。
              </p>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 ml-6">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-lightbulb text-green-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-bold mb-1">使用建议</p>
                    <p className="text-[10px] text-green-600 font-medium leading-relaxed">
                      前往"题库管理"页面，点击题库卡片右上角的下载图标即可导出单个题库备份。
                      题库备份包含完整的题目内容、图片和标签信息，可在任何时候一键恢复。
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  // 跳转到题库管理页面
                  const event = new CustomEvent('navigate', { detail: { path: '/admin/banks' } });
                  window.dispatchEvent(event);
                }}
                className="ml-6 bg-green-600 text-white px-6 py-3 rounded-xl font-black hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-right"></i>
                前往题库管理
              </button>
            </div>
          </div>

          {/* 安全凭证设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-rose-600 flex items-center gap-2">
              <i className="fa-solid fa-key"></i> 管理员密码更新
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passForm.newP !== passForm.confirm) return alert('两次输入的密码不一致');
              onChangeAdminPass(passForm.old, passForm.newP).then(res => {
                if(res) { 
                  alert('密码修改成功'); 
                  setPassForm({ old: '', newP: '', confirm: '' }); 
                } else {
                  alert('原密码错误');
                }
              });
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  className="bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-100 font-bold" 
                  type="password" 
                  placeholder="当前管理员密码" 
                  value={passForm.old}
                  onChange={e => setPassForm({...passForm, old: e.target.value})}
                />
                <input 
                  className="bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-100 font-bold" 
                  type="password" 
                  placeholder="设置新密码" 
                  value={passForm.newP}
                  onChange={e => setPassForm({...passForm, newP: e.target.value})}
                />
                <input 
                  className="bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-100 font-bold" 
                  type="password" 
                  placeholder="确认新密码" 
                  value={passForm.confirm}
                  onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                />
              </div>
              <button type="submit" className="bg-rose-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-rose-100 active:scale-95 transition-all">确认更新密码</button>
            </form>
          </div>

          {/* 数据清理 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-orange-600 flex items-center gap-2">
              <i className="fa-solid fa-broom"></i> 数据清理与归档
              <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-3 py-1 rounded-full">功能规划中</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              定期清理过期数据，保持系统运行流畅。以下功能将在后续版本中实现。
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-clock-rotate-left text-orange-500"></i>
                      <span className="font-bold text-gray-800 text-sm">登录日志</span>
                    </div>
                    <span className="text-[10px] font-black bg-white text-orange-600 px-2 py-1 rounded-lg">保留 90 天</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mb-3">自动清理 90 天前的登录记录</p>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-400 py-2 rounded-xl text-xs font-black cursor-not-allowed"
                  >
                    功能开发中
                  </button>
                </div>

                <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-file-lines text-purple-500"></i>
                      <span className="font-bold text-gray-800 text-sm">考试记录</span>
                    </div>
                    <span className="text-[10px] font-black bg-white text-purple-600 px-2 py-1 rounded-lg">保留 180 天</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mb-3">自动清理 180 天前的考试历史</p>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-400 py-2 rounded-xl text-xs font-black cursor-not-allowed"
                  >
                    功能开发中
                  </button>
                </div>

                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-book text-blue-500"></i>
                      <span className="font-bold text-gray-800 text-sm">练习记录</span>
                    </div>
                    <span className="text-[10px] font-black bg-white text-blue-600 px-2 py-1 rounded-lg">保留 180 天</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mb-3">自动清理 180 天前的练习进度</p>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-400 py-2 rounded-xl text-xs font-black cursor-not-allowed"
                  >
                    功能开发中
                  </button>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-trash text-gray-500"></i>
                      <span className="font-bold text-gray-800 text-sm">临时数据</span>
                    </div>
                    <span className="text-[10px] font-black bg-white text-gray-600 px-2 py-1 rounded-lg">立即清理</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mb-3">清理缓存、临时文件等</p>
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-400 py-2 rounded-xl text-xs font-black cursor-not-allowed"
                  >
                    功能开发中
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-info-circle text-blue-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 font-bold mb-1">功能说明</p>
                    <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                      数据清理功能将在后续版本中实现。目前系统会自动管理数据，无需手动清理。
                      如需释放存储空间，建议定期导出重要数据后，通过数据库管理工具进行清理。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-amber-700 font-bold mb-1">清理提示</p>
                    <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                      数据清理操作不可恢复，建议在清理前先导出数据备份。系统会自动保留重要数据，如题库、学员信息等。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 备份计划 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-lg text-cyan-600 flex items-center gap-2">
                  <i className="fa-solid fa-clock"></i> 自动备份计划
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">配置定时自动备份策略（功能预留）</p>
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200">即将推出</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">备份频率</label>
                  <select 
                    className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-cyan-200 transition-all"
                    value={form?.backupFrequency || 'daily'}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), backupFrequency: e.target.value }))}
                  >
                    <option value="none">不自动备份</option>
                    <option value="daily">每天备份</option>
                    <option value="weekly">每周备份</option>
                    <option value="monthly">每月备份</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">保留份数</label>
                  <select 
                    className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-cyan-200 transition-all"
                    value={form?.backupRetention || '7'}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), backupRetention: e.target.value }))}
                  >
                    <option value="3">保留 3 份</option>
                    <option value="7">保留 7 份</option>
                    <option value="14">保留 14 份</option>
                    <option value="30">保留 30 份</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-cyan-50 hover:border-cyan-100 transition-all">
                  <input 
                    type="checkbox" 
                    checked={form?.backupNotification !== false}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), backupNotification: e.target.checked }))}
                    className="w-5 h-5 rounded accent-cyan-600"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 text-sm">备份完成通知</span>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">备份完成后在系统中显示通知</p>
                  </div>
                </label>
              </div>

              <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-circle-info text-cyan-400 mt-0.5"></i>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-cyan-700 font-bold">功能说明</p>
                    <ul className="text-[10px] text-cyan-600 font-medium space-y-1 leading-relaxed">
                      <li>• 自动备份功能正在开发中，当前仅支持手动备份</li>
                      <li>• 未来版本将支持定时自动备份到本地或云存储</li>
                      <li>• 备份文件将包含所有题库、学员数据、考试记录等</li>
                      <li>• 建议定期手动导出备份，确保数据安全</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 智能化 */}
      {activeCategory === 'ai' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* AI 模型选择 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-black text-lg text-indigo-900 flex items-center gap-2">
                  <i className="fa-solid fa-robot text-indigo-600"></i> AI 模型配置
                </h3>
                <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                  选择 AI 服务提供商并配置 API 密钥
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">AI 服务提供商</label>
                <select 
                  className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  value={form?.aiProvider || 'deepseek'}
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), aiProvider: e.target.value }))}
                >
                  <option value="deepseek">DeepSeek（推荐）</option>
                  <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Gemini (Google)</option>
                  <option value="wenxin">文心一言 (百度)</option>
                  <option value="qwen">通义千问 (阿里云)</option>
                  <option value="glm">智谱清言 (GLM)</option>
                  <option value="moonshotai">月之暗面 (Moonshot AI)</option>
                  <option value="minimaxai">MiniMax AI</option>
                  <option value="openai-completions">OpenAI Completions（自定义）</option>
                </select>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 space-y-4">
                {/* 基础地址配置 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <i className="fa-solid fa-server"></i> 基础地址（Base URL）
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                    value={form?.aiBaseUrl || (() => {
                      // 根据不同服务商设置默认基础地址
                      const provider = form?.aiProvider || 'deepseek';
                      const defaultUrls = {
                        'deepseek': 'https://api.deepseek.com',
                        'openai': 'https://api.openai.com/v1',
                        'claude': 'https://api.anthropic.com',
                        'gemini': 'https://generativelanguage.googleapis.com',
                        'wenxin': 'https://aip.baidubce.com',
                        'qwen': 'https://dashscope.aliyuncs.com/api/v1',
                        'glm': 'https://open.bigmodel.cn/api/paas/v4',
                        'moonshotai': 'https://api.moonshot.cn/v1',
                        'minimaxai': 'https://api.minimax.chat/v1',
                        'openai-completions': ''
                      };
                      return defaultUrls[provider] || '';
                    })()} 
                    placeholder={form?.aiProvider === 'openai-completions' ? '请输入自定义基础地址' : '默认基础地址'}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), aiBaseUrl: e.target.value }))} 
                  />
                  <p className="text-[10px] text-indigo-500 font-medium italic ml-1">
                    {form?.aiProvider === 'openai-completions' 
                      ? '自定义模式需要手动填写完整的 API 基础地址' 
                      : '留空则使用默认地址，可自定义代理地址'}
                  </p>
                </div>

                {/* 模型ID配置 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <i className="fa-solid fa-microchip"></i> 模型 ID（Model ID）
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                    value={form?.aiModelId || (() => {
                      // 根据不同服务商设置默认模型ID
                      const provider = form?.aiProvider || 'deepseek';
                      const defaultModels = {
                        'deepseek': 'deepseek-chat',
                        'openai': 'gpt-4-turbo-preview',
                        'claude': 'claude-3-opus-20240229',
                        'gemini': 'gemini-pro',
                        'wenxin': 'ERNIE-Bot-4',
                        'qwen': 'qwen-max',
                        'glm': 'glm-4',
                        'moonshotai': 'moonshot-v1-8k',
                        'minimaxai': 'abab6-chat',
                        'openai-completions': ''
                      };
                      return defaultModels[provider] || '';
                    })()} 
                    placeholder={form?.aiProvider === 'openai-completions' ? '请输入模型ID，如：gpt-3.5-turbo' : '默认模型ID'}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), aiModelId: e.target.value }))} 
                  />
                  <p className="text-[10px] text-indigo-500 font-medium italic ml-1">
                    {form?.aiProvider === 'openai-completions' 
                      ? '自定义模式需要手动填写模型ID' 
                      : '留空则使用推荐模型，可根据需要切换其他模型'}
                  </p>
                </div>

                {/* API Key配置 */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <i className="fa-solid fa-key"></i> 管理员全局 API Key
                   </label>
                   <div className="flex gap-2">
                     <input 
                       type={showApiKey ? 'text' : 'password'}
                       className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                       value={form?.aiApiKeys?.[form?.aiProvider || 'deepseek'] ?? form?.deepseekApiKey ?? ''} 
                       placeholder="请输入 API Key"
                       onChange={e => {
                         const provider = form?.aiProvider || 'deepseek';
                         setForm((prev: any) => ({
                           ...(prev || defaultForm),
                           aiApiKeys: { ...(prev?.aiApiKeys || {}), [provider]: e.target.value },
                           // 兼容旧字段：deepseek 服务商同步写入 deepseekApiKey
                           ...(provider === 'deepseek' ? { deepseekApiKey: e.target.value } : {})
                         }));
                       }}
                     />
                     <button
                       type="button"
                       onClick={() => setShowApiKey(v => !v)}
                       className="px-4 py-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-all text-sm"
                       title={showApiKey ? '隐藏' : '查看'}
                     >
                       <i className={`fa-solid ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                     </button>
                   </div>
                 </div>

                {/* API Key 获取链接 */}
                <div className="flex flex-wrap gap-2">
                  {form?.aiProvider === 'deepseek' && (
                    <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取 DeepSeek API Key
                    </a>
                  )}
                  {form?.aiProvider === 'openai' && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取 OpenAI API Key
                    </a>
                  )}
                  {form?.aiProvider === 'claude' && (
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取 Claude API Key
                    </a>
                  )}
                  {form?.aiProvider === 'gemini' && (
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取 Gemini API Key
                    </a>
                  )}
                  {form?.aiProvider === 'wenxin' && (
                    <a href="https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取文心一言 API Key
                    </a>
                  )}
                  {form?.aiProvider === 'qwen' && (
                    <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取通义千问 API Key
                    </a>
                  )}
                  {form?.aiProvider === 'glm' && (
                    <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取智谱清言 API Key
                    </a>
                  )}
                  {form?.aiProvider === 'moonshotai' && (
                    <a href="https://platform.moonshot.cn/console/api-keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取月之暗面 API Key
                    </a>
                  )}
                  {form?.aiProvider === 'minimaxai' && (
                    <a href="https://api.minimax.chat/user-center/basic-information/interface-key" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm">
                      <i className="fa-solid fa-external-link-alt"></i> 获取 MiniMax API Key
                    </a>
                  )}
                  {form?.aiProvider === 'openai-completions' && (
                    <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                      <p className="text-xs text-amber-700 font-bold">
                        <i className="fa-solid fa-circle-info mr-1"></i>
                        自定义模式：请根据您的服务商获取 API Key
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-indigo-400 mt-0.5"></i>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-indigo-700 font-bold">配置说明</p>
                      <ul className="text-[10px] text-indigo-600 font-medium space-y-1 leading-relaxed">
                        <li>• 此密钥将作为全局默认配置，供所有学员使用</li>
                        <li>• 学员可在个人设置中配置自己的 API Key，优先级高于管理员配置</li>
                        <li>• 如果管理员和学员都未配置，AI 功能将无法使用</li>
                        <li>• 推荐使用 DeepSeek，性价比高且响应速度快</li>
                        <li>• 基础地址和模型ID留空时将使用默认值，可根据需要自定义</li>
                        <li>• 自定义模式（openai-completions）需要手动填写所有配置项</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* TTS 支持提示 */}
                {(form?.aiProvider === 'deepseek' || form?.aiProvider === 'claude') && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-xs text-amber-700 font-bold mb-1">TTS 功能提示</p>
                        <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                          当前选择的 AI 服务商（{form?.aiProvider === 'deepseek' ? 'DeepSeek' : 'Claude'}）不支持语音合成（TTS）功能。如需使用题目朗读功能，请选择 OpenAI、Gemini 或文心一言。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-bold">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>API Key 将加密存储，仅用于 AI 功能调用</span>
                </div>
              </div>
            </div>
          </div>

          {/* 自动评分规则 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-sliders text-purple-500"></i> AI 自动评分规则
            </h3>
            <p className="text-xs text-gray-400 font-medium">配置简答题 AI 评分的严格程度和关键词权重</p>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">评分严格程度</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'lenient', label: '宽松', desc: '答对关键点即可得分', color: 'emerald' },
                    { value: 'moderate', label: '适中', desc: '需要较完整的答案', color: 'blue' },
                    { value: 'strict', label: '严格', desc: '要求答案准确完整', color: 'rose' },
                  ].map(level => (
                    <label 
                      key={level.value}
                      className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        (form?.aiGradingStrictness || 'moderate') === level.value
                          ? `bg-${level.color}-50 border-${level.color}-500`
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="strictness"
                        value={level.value}
                        checked={(form?.aiGradingStrictness || 'moderate') === level.value}
                        onChange={e => setForm(prev => ({ ...(prev || defaultForm), aiGradingStrictness: e.target.value }))}
                        className="hidden"
                      />
                      <span className="font-bold text-gray-800 mb-1">{level.label}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{level.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">关键词权重</label>
                  <span className="text-sm font-black text-indigo-600">{form?.keywordWeight || 50}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="10"
                  value={form?.keywordWeight || 50}
                  onChange={e => setForm(prev => ({ ...(prev || defaultForm), keywordWeight: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                  <span>语义理解为主</span>
                  <span>关键词匹配为主</span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium italic">
                  关键词权重越高，评分越依赖关键词匹配；权重越低，越注重语义理解
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-lightbulb text-purple-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-purple-700 font-bold mb-1">评分建议</p>
                    <ul className="text-[10px] text-purple-600 font-medium space-y-1 leading-relaxed">
                      <li>• 宽松模式：适合练习阶段，鼓励学员尝试</li>
                      <li>• 适中模式：平衡准确性和灵活性，推荐日常使用</li>
                      <li>• 严格模式：适合正式考试，要求高标准答案</li>
                      <li>• 关键词权重建议设置在 40-60% 之间</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 语音合成设置 */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-volume-high text-cyan-500"></i> 语音合成（TTS）设置
            </h3>
            <p className="text-xs text-gray-400 font-medium">配置题目朗读功能的语音参数</p>

            {(form?.aiProvider === 'deepseek' || form?.aiProvider === 'claude') ? (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-ban text-amber-500 text-xl mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-sm text-amber-700 font-bold mb-2">TTS 功能不可用</p>
                    <p className="text-xs text-amber-600 font-medium leading-relaxed mb-3">
                      当前选择的 AI 服务商（{form?.aiProvider === 'deepseek' ? 'DeepSeek' : 'Claude'}）不支持语音合成功能。
                    </p>
                    <p className="text-xs text-amber-600 font-medium">
                      如需使用题目朗读功能，请在上方"AI 模型配置"中切换到 <strong>OpenAI</strong>、<strong>Gemini</strong> 或 <strong>文心一言</strong>。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">语速设置</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1"
                      value={form?.ttsSpeed || 1}
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), ttsSpeed: Number(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                    />
                    <span className="text-sm font-black text-cyan-600 min-w-[60px] text-right">{form?.ttsSpeed || 1}x</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                    <span>0.5x 慢速</span>
                    <span>1.0x 正常</span>
                    <span>2.0x 快速</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">音色选择</label>
                  <select 
                    className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-bold outline-none border-2 border-transparent focus:border-cyan-200 transition-all"
                    value={form?.ttsVoice || 'female'}
                    onChange={e => setForm(prev => ({ ...(prev || defaultForm), ttsVoice: e.target.value }))}
                  >
                    <option value="female">女声（温柔）</option>
                    <option value="male">男声（沉稳）</option>
                    <option value="child">童声（活泼）</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-cyan-50 hover:border-cyan-100 transition-all">
                    <input 
                      type="checkbox" 
                      checked={form?.ttsAutoPlay !== false}
                      onChange={e => setForm(prev => ({ ...(prev || defaultForm), ttsAutoPlay: e.target.checked }))}
                      className="w-5 h-5 rounded accent-cyan-600"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-gray-800 text-sm">自动播放</span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">进入题目时自动朗读题干</p>
                    </div>
                  </label>
                </div>

                <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-cyan-400 mt-0.5"></i>
                    <div className="flex-1">
                      <p className="text-xs text-cyan-700 font-bold mb-1">功能说明</p>
                      <ul className="text-[10px] text-cyan-600 font-medium space-y-1 leading-relaxed">
                        <li>• TTS 功能需要消耗 AI 服务商的 API 额度</li>
                        <li>• 建议语速设置在 0.8-1.2x 之间，便于理解</li>
                        <li>• 学员可在做题时手动点击朗读按钮</li>
                        <li>• 自动播放功能可能影响做题节奏，请根据需要开启</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 缓存管理 */}
      {activeCategory === 'cache' && (
        <div className="animate-in fade-in duration-300">
          <CacheManager />
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
