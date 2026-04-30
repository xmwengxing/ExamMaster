
import React, { useState, useEffect } from 'react';
import CacheManager from '../../components/CacheManager';

interface SystemSettingsProps {
  config: any;
  onUpdate: (data: any) => void;
  onChangeAdminPass: (old: string, newP: string) => Promise<boolean>;
  defaultTab?: 'theme' | 'ai' | 'cache';
}

const defaultForm: any = {};

const SystemSettings: React.FC<SystemSettingsProps> = ({ config, onUpdate, onChangeAdminPass, defaultTab }) => {
  const [form, setForm] = useState<any>(config || {});
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'theme' | 'ai' | 'cache'>(defaultTab || 'theme');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [customProvName, setCustomProvName] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

  useEffect(() => {
    setForm(config || {});
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
                {(() => {
                  const builtInProviders = [
                    { value: 'deepseek', label: 'DeepSeek（推荐）' },
                    { value: 'openai', label: 'OpenAI (GPT-4/GPT-3.5)' },
                    { value: 'claude', label: 'Claude (Anthropic)' },
                    { value: 'gemini', label: 'Gemini (Google)' },
                    { value: 'wenxin', label: '文心一言 (百度)' },
                    { value: 'qwen', label: '通义千问 (阿里云)' },
                    { value: 'glm', label: '智谱清言 (GLM)' },
                    { value: 'moonshotai', label: '月之暗面 (Moonshot AI)' },
                    { value: 'minimaxai', label: 'MiniMax AI' },
                    { value: 'openai-completions', label: 'OpenAI Completions（自定义）' },
                  ];
                  const customProviders = (form?.aiCustomProviders || []).map((p: any) => ({
                    value: p.provider || p.name,
                    label: `${p.name || p.provider}（自定义）`,
                    isCustom: true,
                    ...p
                  }));
                  const allProviders = [...builtInProviders, ...customProviders];
                  return (
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                        value={form?.aiProvider || 'deepseek'}
                        onChange={e => setForm(prev => ({ ...(prev || {}), aiProvider: e.target.value }))}
                      >
                        {builtInProviders.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                        {customProviders.length > 0 && (
                          <optgroup label="──── 自定义提供商 ────">
                            {customProviders.map((p: any) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {customProviders.find((p: any) => p.value === form?.aiProvider) && (
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (form?.aiCustomProviders || []).filter((p: any) => (p.provider || p.name) !== form?.aiProvider);
                            setForm(prev => ({ ...(prev || {}), aiCustomProviders: filtered, aiProvider: 'deepseek' }));
                          }}
                          className="px-3 py-3 bg-rose-50 border-2 border-rose-100 rounded-xl text-rose-600 hover:bg-rose-100 transition-all text-sm"
                          title="删除此自定义提供商"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 自定义提供商添加 */}
              {form?.aiProvider === 'openai-completions' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-black text-amber-700">
                    <i className="fa-solid fa-puzzle-piece mr-1"></i> 添加自定义 AI 提供商
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white border-2 border-amber-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="提供商名称（必填）"
                      value={customProvName}
                      onChange={e => setCustomProvName(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={!customProvName.trim() || addingProvider}
                      onClick={async () => {
                        if (!customProvName.trim()) return;
                        setAddingProvider(true);
                        setTestResult(null);
                        try {
                          const providerKey = 'custom-' + Date.now();
                          const newProvider = {
                            provider: providerKey,
                            name: customProvName.trim(),
                            baseUrl: form?.aiBaseUrl,
                            modelId: form?.aiModelId,
                            apiKey: form?.aiApiKeys?.[form?.aiProvider || 'deepseek'] ?? form?.deepseekApiKey,
                          };
                          const updated = [...(form?.aiCustomProviders || []), newProvider];
                          setForm(prev => ({
                            ...(prev || {}),
                            aiCustomProviders: updated,
                            aiProvider: providerKey
                          }));
                          setCustomProvName('');
                          setTestResult({ ok: true, message: `提供商「${customProvName.trim()}」已添加` });
                        } catch (e: any) {
                          setTestResult({ ok: false, message: e.message || '添加失败' });
                        }
                        setAddingProvider(false);
                      }}
                      className="flex items-center gap-2 bg-amber-600 text-white px-5 py-3 rounded-xl font-black text-sm hover:bg-amber-700 transition-all disabled:opacity-50"
                    >
                      {addingProvider ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> 添加中</>
                      ) : (
                        <><i className="fa-solid fa-plus"></i> 添加提供商</>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 font-medium italic">
                    填写提供商名称后点击"添加提供商"按钮即可保存到提供商列表。添加后可以点击垃圾桶图标删除。
                  </p>
                </div>
              )}

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

                {/* 高级参数配置 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fa-solid fa-expand"></i> 最长上下文（Max Context）
                    </label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                      value={form?.aiMaxContext || ''} 
                      placeholder="留空使用默认值"
                      onChange={e => setForm(prev => ({ ...(prev || {}), aiMaxContext: e.target.value ? parseInt(e.target.value) : undefined }))} 
                    />
                    <p className="text-[9px] text-indigo-400 font-medium italic ml-1">
                      选填，例如：4096、8192、32768
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fa-solid fa-gauge-high"></i> 最大 Token（Max Tokens）
                    </label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                      value={form?.aiMaxTokens || ''} 
                      placeholder="留空使用默认值"
                      onChange={e => setForm(prev => ({ ...(prev || {}), aiMaxTokens: e.target.value ? parseInt(e.target.value) : undefined }))} 
                    />
                    <p className="text-[9px] text-indigo-400 font-medium italic ml-1">
                      选填，例如：1024、2048、4096
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fa-solid fa-tag"></i> 模型别名（Model Alias）
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                      value={form?.aiModelAlias || ''} 
                      placeholder="留空使用实际模型名"
                      onChange={e => setForm(prev => ({ ...(prev || {}), aiModelAlias: e.target.value }))} 
                    />
                    <p className="text-[9px] text-indigo-400 font-medium italic ml-1">
                      选填，用于UI展示，不影响API调用
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-500 font-medium italic">
                  <i className="fa-solid fa-circle-info mr-1"></i>
                  以上三项为选填参数。留空时将自动使用模型默认值，系统会尝试从端点 URL 自动加载
                </p>

                {/* 测试连接按钮 */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={async () => {
                      setTesting(true);
                      setTestResult(null);
                      const start = Date.now();
                      try {
                        const res = await fetch('/api/admin/ai/test-connection', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('edu_token')}`
                          },
                          body: JSON.stringify({
                            provider: form?.aiProvider || 'deepseek',
                            baseUrl: form?.aiBaseUrl,
                            modelId: form?.aiModelId,
                            apiKey: form?.aiApiKeys?.[form?.aiProvider || 'deepseek'] ?? form?.deepseekApiKey,
                            maxContext: form?.aiMaxContext,
                            maxTokens: form?.aiMaxTokens,
                          })
                        });
                        const latency = Date.now() - start;
                        const data = await res.json().catch(() => ({}));
                        const ok = data.ok !== false && res.ok;
                        setTestResult({ ok, message: data.message || (res.ok ? '连接成功' : `HTTP ${res.status}`), latency });
                      } catch (e: any) {
                        const latency = Date.now() - start;
                        setTestResult({ ok: false, message: e.message || '网络错误', latency });
                      }
                      setTesting(false);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {testing ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> 测试中...</>
                    ) : (
                      <><i className="fa-solid fa-plug"></i> 测试连接</>
                    )}
                  </button>
                  {testResult && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
                      testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      <i className={`fa-solid ${testResult.ok ? 'fa-check-circle' : 'fa-xmark-circle'}`}></i>
                      {testResult.message}
                      {testResult.latency !== undefined && (
                        <span className="opacity-70 ml-1">({testResult.latency}ms)</span>
                      )}
                    </div>
                  )}
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
