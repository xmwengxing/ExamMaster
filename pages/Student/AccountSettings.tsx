
import React, { useState } from 'react';
import { useAppStore } from '../../store';

interface AccountSettingsProps {
  onBack: () => void;
  onChangePassword: (old: string, newP: string) => Promise<boolean> | boolean;
  onResetData: () => Promise<void>;
  onLogout: () => void;
  onDeleteAccount: () => void;
  currentUser: any;
  onUpdateApiKey: (apiKey: string) => Promise<void>;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  onBack, onChangePassword, onResetData, onLogout, onDeleteAccount, currentUser, onUpdateApiKey
}) => {
  const [passForm, setPassForm] = useState({ old: '', newP: '', confirm: '' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [apiKey, setApiKey] = useState(currentUser?.deepseekApiKey || '');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  
  // AI 配置状态
  const [aiProvider, setAiProvider] = useState(currentUser?.aiProvider || 'deepseek');
  const [ttsSpeed, setTtsSpeed] = useState(currentUser?.ttsSpeed || 1);
  const [ttsVoice, setTtsVoice] = useState(currentUser?.ttsVoice || 'female');
  const [ttsAutoPlay, setTtsAutoPlay] = useState(currentUser?.ttsAutoPlay !== false);

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.old || !passForm.newP) return alert('请完整填写密码信息');
    if (passForm.newP !== passForm.confirm) return alert('两次输入的新密码不一致');
    
    const success = await onChangePassword(passForm.old, passForm.newP);
    if (success) {
      alert('密码修改成功！');
      setPassForm({ old: '', newP: '', confirm: '' });
    } else {
      alert('原密码验证失败，请重试');
    }
  };

  const executeReset = async () => {
    setIsResetting(true);
    try {
      await onResetData();
      setShowResetConfirm(false);
      alert('学习数据已成功重置，账号已恢复至初始状态。');
    } catch (err) {
      alert('重置失败，请稍后重试');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingApiKey(true);
    try {
      // 保存 API Key 和 AI 配置
      await onUpdateApiKey(apiKey);
      // 保存其他 AI 配置
      await useAppStore.getState().updateProfile({
        deepseekApiKey: apiKey,
        aiProvider,
        ttsSpeed,
        ttsVoice,
        ttsAutoPlay
      });
      alert('AI 配置已保存');
    } catch (err) {
      alert('保存失败，请稍后重试');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 md:space-y-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 shadow-sm active:scale-90 transition-transform">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-gray-900">账号与系统设置</h2>
      </div>

      <section className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 space-y-4 md:space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-sm md:text-base">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h3 className="font-black text-gray-800 text-sm md:text-base">安全凭证修改</h3>
        </div>

        <form onSubmit={handlePassChange} className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">当前旧密码</label>
            <input 
              type="password" 
              className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base"
              value={passForm.old} 
              onChange={e => setPassForm({...passForm, old: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">新密码</label>
            <input 
              type="password" 
              className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base"
              value={passForm.newP} 
              onChange={e => setPassForm({...passForm, newP: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">确认新密码</label>
            <input 
              type="password" 
              className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base"
              value={passForm.confirm} 
              onChange={e => setPassForm({...passForm, confirm: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all text-sm md:text-base">
            确认修改密码
          </button>
        </form>
      </section>

      {/* AI 智能配置 */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 border-2 border-purple-100 space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-sm md:text-base">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-sm md:text-base">AI 智能配置</h3>
              <p className="text-[9px] md:text-[10px] text-purple-600 font-medium mt-0.5">个人专属 AI 服务设置</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-3 md:p-5 rounded-xl md:rounded-2xl border border-purple-100 space-y-4 md:space-y-5">
          {/* AI 服务商选择 */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1">AI 服务提供商</label>
            <select 
              className="w-full bg-white border-2 border-purple-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 font-bold outline-none focus:ring-2 focus:ring-purple-200 transition-all text-xs md:text-sm"
              value={aiProvider}
              onChange={e => setAiProvider(e.target.value)}
            >
              <option value="deepseek">DeepSeek（推荐）</option>
              <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
              <option value="wenxin">文心一言 (百度)</option>
            </select>
          </div>

          {/* API Key 输入 */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-2">
              <i className="fa-solid fa-key"></i> 个人 API Key（可选）
            </label>
            <input 
              type="password"
              className="w-full bg-white border-2 border-purple-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 font-mono text-xs md:text-sm outline-none focus:ring-2 focus:ring-purple-200 transition-all" 
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {aiProvider === 'deepseek' && (
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-external-link-alt"></i> 获取 DeepSeek API Key
                </a>
              )}
              {aiProvider === 'openai' && (
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-external-link-alt"></i> 获取 OpenAI API Key
                </a>
              )}
              {aiProvider === 'claude' && (
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-external-link-alt"></i> 获取 Claude API Key
                </a>
              )}
              {aiProvider === 'gemini' && (
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-external-link-alt"></i> 获取 Gemini API Key
                </a>
              )}
              {aiProvider === 'wenxin' && (
                <a href="https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application" target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-external-link-alt"></i> 获取文心一言 API Key
                </a>
              )}
            </div>
          </div>

          {/* TTS 不支持提示 */}
          {(aiProvider === 'deepseek' || aiProvider === 'claude') && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-xs"></i>
                <p className="text-[9px] md:text-[10px] text-amber-600 font-medium leading-relaxed">
                  当前选择的 AI 服务商不支持语音合成（TTS）功能。如需使用题目朗读，请选择 OpenAI、Gemini 或文心一言。
                </p>
              </div>
            </div>
          )}

          {/* TTS 语音设置 */}
          {aiProvider !== 'deepseek' && aiProvider !== 'claude' && (
            <div className="space-y-3 md:space-y-4 pt-3 border-t border-purple-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-volume-high text-cyan-500"></i>
                <span className="text-xs md:text-sm font-black text-gray-800">语音合成设置</span>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">语速</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                    value={ttsSpeed}
                    onChange={e => setTtsSpeed(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                  <span className="text-xs font-black text-cyan-600 min-w-[50px] text-right">{ttsSpeed}x</span>
                </div>
                <div className="flex justify-between text-[8px] md:text-[9px] text-gray-400 font-medium">
                  <span>慢速</span>
                  <span>正常</span>
                  <span>快速</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">音色</label>
                <select 
                  className="w-full bg-white border-2 border-gray-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 font-bold outline-none focus:ring-2 focus:ring-cyan-200 transition-all text-xs md:text-sm"
                  value={ttsVoice}
                  onChange={e => setTtsVoice(e.target.value)}
                >
                  <option value="female">女声（温柔）</option>
                  <option value="male">男声（沉稳）</option>
                  <option value="child">童声（活泼）</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-cyan-50 hover:border-cyan-100 transition-all">
                <input 
                  type="checkbox" 
                  checked={ttsAutoPlay}
                  onChange={e => setTtsAutoPlay(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-600"
                />
                <div className="flex-1">
                  <span className="font-bold text-gray-800 text-xs md:text-sm">自动播放</span>
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-medium mt-0.5">进入题目时自动朗读</p>
                </div>
              </label>
            </div>
          )}
          
          <div className="bg-purple-50/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-purple-100">
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-lightbulb text-purple-400 mt-0.5 text-xs md:text-sm"></i>
              <div className="flex-1 space-y-1.5 md:space-y-2">
                <p className="text-[10px] md:text-xs text-purple-700 font-bold">功能说明</p>
                <ul className="text-[9px] md:text-[10px] text-purple-600 font-medium space-y-0.5 md:space-y-1 leading-relaxed">
                  <li>• <span className="font-black">题目深度解析</span>：AI 分析题目考点和解题思路</li>
                  <li>• <span className="font-black">语音朗读</span>：智能朗读题目内容和选项</li>
                  <li>• <span className="font-black">实操评价</span>：AI 评估实操练习的完成质量</li>
                  <li>• <span className="font-black">智能复习</span>：基于遗忘曲线的个性化复习建议</li>
                </ul>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSaveApiKey}
            disabled={isSavingApiKey}
            className="w-full bg-purple-600 text-white py-2.5 md:py-3 rounded-lg md:rounded-xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50"
          >
            {isSavingApiKey ? '保存中...' : '保存 AI 配置'}
          </button>
        </div>
      </section>

      <section className="bg-rose-50/30 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 border border-rose-100 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center text-sm md:text-base">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 className="font-black text-rose-600 text-sm md:text-base">数据与风险管理</h3>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-rose-50 space-y-2 md:space-y-3">
             <div className="font-black text-xs md:text-sm text-gray-800">重置学习进度</div>
             <p className="text-[9px] md:text-[10px] text-gray-400 font-bold leading-relaxed">该操作将清空所有练习记录、考试历史及错题。个人资料（姓名、学校等）将保留。</p>
             <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 md:py-3 bg-white border border-rose-200 text-rose-600 rounded-lg md:rounded-xl text-xs font-black hover:bg-rose-50 active:scale-95 transition-all"
             >
                重置练习记录
             </button>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-rose-50 space-y-2 md:space-y-3">
             <div className="font-black text-xs md:text-sm text-gray-800">注销账号</div>
             <p className="text-[9px] md:text-[10px] text-gray-400 font-bold leading-relaxed">彻底删除您的身份信息及所有关联数据，注销后不可恢复。</p>
             <button 
                onClick={() => {
                  if (confirm('【最高警告】确认注销账号吗？此操作将永久抹除您的身份信息和所有数据！')) onDeleteAccount();
                }}
                className="w-full py-2.5 md:py-3 bg-rose-600 text-white rounded-lg md:rounded-xl text-xs font-black shadow-lg shadow-rose-100 active:scale-95 transition-all"
             >
                申请注销账号
             </button>
          </div>
        </div>
      </section>

      {/* 退出登录按钮 - 放在最下方 */}
      <button 
        onClick={onLogout}
        className="w-full bg-gray-900 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black active:scale-95 transition-all shadow-xl text-sm md:text-base"
      >
        <i className="fa-solid fa-power-off mr-2"></i>立即退出登录
      </button>

      {/* 自定义重置确认模态框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-6 animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">确认重置进度吗？</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
              此操作将永久抹除以下数据且<span className="text-rose-500 font-black">无法恢复</span>：
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-8">
              {['练习记录', '考试历史', '错题本', '收藏题目', '学习笔记', '每日进度', 'SRS复习', '实操记录', '讨论点赞', '评论内容'].map((item, i) => (
                <div key={i} className="bg-gray-50 py-2 px-3 rounded-xl text-[10px] font-black text-gray-500 border border-gray-100 flex items-center gap-2">
                  <i className="fa-solid fa-circle-xmark text-rose-300"></i> {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={executeReset}
                disabled={isResetting}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isResetting ? <i className="fa-solid fa-spinner animate-spin"></i> : '确认并执行重置'}
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black hover:bg-gray-100 transition-all"
              >
                取消
              </button>
            </div>
            <p className="text-[9px] text-gray-300 font-bold mt-4 uppercase tracking-widest">您的实名档案信息将予以保留</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
