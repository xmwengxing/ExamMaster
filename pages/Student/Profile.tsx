
import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { EDUCATION_TYPE_OPTIONS, EDUCATION_LEVEL_OPTIONS, PRESET_AVATARS } from '../../constants';

interface ProfileProps {
  user: User;
  customFieldSchema: string[];
  onUpdate: (data: Partial<User>) => void;
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, customFieldSchema, onUpdate, onBack }) => {
  const [form, setForm] = useState({ 
    ...user,
    customFields: user.customFields || {}
  });
  
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'preset' | 'upload'>('preset');
  const [genderFilter, setGenderFilter] = useState<'male' | 'female'>('male');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    alert('个人资料更新成功');
    onBack();
  };

  const updateCustomField = (name: string, value: string) => {
    setForm({
      ...form,
      customFields: {
        ...form.customFields,
        [name]: value
      }
    });
  };

  // 图像缩放与裁剪逻辑 (目标 256x256)
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // 计算裁剪区域（居中裁剪）
            let dx = 0, dy = 0, dw = img.width, dh = img.height;
            const aspect = img.width / img.height;
            
            if (aspect > 1) {
              // 宽图
              dw = img.height;
              dx = (img.width - img.height) / 2;
            } else {
              // 高图
              dh = img.width;
              dy = (img.height - img.width) / 2;
            }
            
            ctx.drawImage(img, dx, dy, dw, dh, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resizedBase64 = await processImage(file);
    setForm({ ...form, avatar: resizedBase64 });
    setShowAvatarModal(false);
    e.target.value = ''; // 重置 input
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 shadow-sm active:scale-90 transition-transform">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-gray-900">我的个人档案</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-4 md:p-10 shadow-sm border border-gray-100 space-y-6 md:space-y-12">
        {/* 头像展示区 */}
        <div className="flex flex-col items-center py-2 md:py-4 border-b border-dashed border-gray-100">
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            {form.avatar ? (
              <img src={form.avatar} className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] border-2 md:border-4 border-white shadow-xl object-cover" alt="Avatar" />
            ) : (
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] border-2 md:border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center text-indigo-600 font-black text-2xl md:text-3xl">{(form.realName || form.nickname || '学员')[0]}</div>
            )}
            <div className="absolute inset-0 bg-black/20 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <i className="fa-solid fa-camera text-white text-xl md:text-2xl"></i>
            </div>
            <button type="button" className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-indigo-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center border-2 md:border-4 border-white shadow-lg text-xs md:text-base">
              <i className="fa-solid fa-pen"></i>
            </button>
          </div>
          <div className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 md:mt-4">点击图片更新头像</div>
        </div>

        {/* 核心身份信息 */}
        <div className="space-y-4 md:space-y-8">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 md:h-5 bg-indigo-600 rounded-full"></span>
            <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest">核心身份档案</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 md:gap-y-6">
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">真实姓名</label>
              <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base" value={form.realName} onChange={e => setForm({...form, realName: e.target.value})} />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">性别</label>
              <select className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none appearance-none text-sm md:text-base" value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">未设置</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">身份证号</label>
              <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base" value={form.idCard || ''} onChange={e => setForm({...form, idCard: e.target.value})} />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">绑定手机 (不可修改)</label>
              <input className="w-full bg-gray-100 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold text-gray-400 cursor-not-allowed text-sm md:text-base" value={form.phone} readOnly />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">工作单位</label>
              <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base" value={form.company || ''} onChange={e => setForm({...form, company: e.target.value})} />
            </div>
          </div>
        </div>

        {/* 教育与背景 */}
        <div className="space-y-4 md:space-y-8 pt-4 md:pt-8 border-t border-dashed">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 md:h-5 bg-emerald-500 rounded-full"></span>
            <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest">教育背景</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 md:gap-y-6">
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">毕业院校</label>
              <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base" value={form.school || ''} onChange={e => setForm({...form, school: e.target.value})} />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">所学专业</label>
              <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base" value={form.major || ''} onChange={e => setForm({...form, major: e.target.value})} />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">学历性质</label>
              <select className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none appearance-none text-sm md:text-base" value={form.educationType || ''} onChange={e => setForm({...form, educationType: e.target.value})}>
                <option value="">未设置</option>
                {EDUCATION_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">最高学历</label>
              <select className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none appearance-none text-sm md:text-base" value={form.educationLevel || ''} onChange={e => setForm({...form, educationLevel: e.target.value})}>
                <option value="">未设置</option>
                {EDUCATION_LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 补充字段 */}
        {customFieldSchema.length > 0 && (
          <div className="space-y-4 md:space-y-8 pt-4 md:pt-8 border-t border-dashed">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 md:h-5 bg-indigo-400 rounded-full"></span>
              <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest">补充档案</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 md:gap-y-6">
              {customFieldSchema.map(field => (
                <div key={field} className="space-y-1 md:space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{field}</label>
                  <input 
                    className="w-full bg-indigo-50/20 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm md:text-base"
                    value={form.customFields?.[field] || ''}
                    onChange={e => updateCustomField(field, e.target.value)}
                    placeholder={`请输入${field}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 md:pt-10">
          <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 md:py-5 rounded-xl md:rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 active:scale-95 transition-all text-base md:text-lg">
            确认修改并保存
          </button>
        </div>
      </form>

      {/* 头像修改弹窗 */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">更新个人头像</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-gray-300 hover:text-gray-500"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
              <button onClick={() => setAvatarTab('preset')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${avatarTab === 'preset' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>推荐库</button>
              <button onClick={() => setAvatarTab('upload')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${avatarTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>自定义上传</button>
            </div>

            {avatarTab === 'preset' ? (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <button onClick={() => setGenderFilter('male')} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${genderFilter === 'male' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>男生头像</button>
                  <button onClick={() => setGenderFilter('female')} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${genderFilter === 'female' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>女生头像</button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {PRESET_AVATARS[genderFilter].map((url, i) => (
                    <button key={i} onClick={() => { setForm({...form, avatar: url}); setShowAvatarModal(false); }} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${form.avatar === url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-50'}`}>
                      <img src={url} className="w-full h-full object-cover" alt="Preset" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-12 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 font-bold hover:bg-gray-50 hover:border-indigo-100 transition-all flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-gray-700">点击上传图片</p>
                    <p className="text-[10px] mt-1 opacity-60">自动缩放并裁剪至 256x256 分辨率</p>
                  </div>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            )}
            
            <button onClick={() => setShowAvatarModal(false)} className="w-full mt-6 py-4 text-gray-400 font-bold">取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
