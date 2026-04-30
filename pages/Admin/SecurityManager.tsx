import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store';

interface SecurityManagerProps {
  onChangeAdminPass: (old: string, newP: string) => Promise<boolean>;
}

const SecurityManager: React.FC<SecurityManagerProps> = ({ onChangeAdminPass }) => {
  const store = useAppStore();
  const [passForm, setPassForm] = useState({ old: '', newP: '', confirm: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  return (
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
                value="daily"
                onChange={() => {}}
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
                value="7"
                onChange={() => {}}
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
                checked={true}
                onChange={() => {}}
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
  );
};

export default SecurityManager;
