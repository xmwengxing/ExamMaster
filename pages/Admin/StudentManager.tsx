
import React, { useState, useRef, useMemo } from 'react';
import { User } from '../../types';
import { EDUCATION_TYPE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '../../constants';

interface StudentManagerProps {
  students: User[];
  customFields: string[];
  onDelete: (ids: string[]) => void;
  onAdd: (student: any) => void;
  onUpdate: (id: string, data: any) => void;
  onAddField: (name: string) => void;
  onRemoveField: (name: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, customFields, onDelete, onAdd, onUpdate, onAddField, onRemoveField }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [newFieldName, setNewFieldName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 分页相关
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 搜索逻辑：支持姓名、手机号、工作单位搜索
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.realName?.toLowerCase().includes(term) || 
      s.phone?.includes(term) ||
      s.company?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => 
    filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  , [filtered, currentPage]);

  const handleSave = () => {
    if (!form.realName || !form.phone) return alert('姓名和手机号为必填项');
    
    const submitData = { ...form };
    
    if (editingId) {
      if (!submitData.password) delete submitData.password;
      onUpdate(editingId, submitData);
    } else {
      onAdd({ 
        ...submitData, 
        id: Date.now().toString(), 
        role: 'STUDENT', 
        // 默认密码为手机号后6位
        password: submitData.password || submitData.phone.slice(-6),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${submitData.phone}`,
        accuracy: 0, 
        mistakeCount: 0,
        studentPerms: ['BANK', 'VIDEO', 'EXAM']
      });
    }
    setIsModalOpen(false);
    setForm({});
  };

  const handleDownloadTemplate = () => {
    const fixedHeaders = ['姓名*', '手机号*', '性别', '密码', '身份证号', '毕业院校', '学历性质', '最高学历', '专业', '工作单位', '班级'];
    const headers = [...fixedHeaders, ...customFields].join(',');
    const example = ['张三', '13800138001', '男', '123456', '440101199001018888', '清华大学', '全日制', '本科', '计算机', '某科技公司', '2024春季班'].join(',');
    const blob = new Blob([`\uFEFF${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "学员导入模板.csv";
    link.click();
  };

  const handleBatchImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const headerRow = lines[0].split(',');
      
      const newStudents = lines.slice(1).map((line, idx) => {
        const values = line.split(',');
        const s: any = { customFields: {} };
        headerRow.forEach((h, i) => {
          const val = values[i]?.trim();
          const cleanH = h.replace('*', '').trim();
          if (cleanH === '姓名') s.realName = val;
          else if (cleanH === '手机号') s.phone = val;
          else if (cleanH === '性别') s.gender = val;
          else if (cleanH === '密码') s.password = val;
          else if (cleanH === '身份证号') s.idCard = val;
          else if (cleanH === '毕业院校') s.school = val;
          else if (cleanH === '学历性质') s.educationType = val;
          else if (cleanH === '最高学历') s.educationLevel = val;
          else if (cleanH === '专业') s.major = val;
          else if (cleanH === '工作单位') s.company = val;
          else if (cleanH === '班级') s.className = val;
          else if (customFields.includes(cleanH)) s.customFields[cleanH] = val;
        });

        // 批量导入默认密码逻辑：若未填密码则取手机号后6位，否则取123456兜底
        if (!s.password) {
            s.password = s.phone ? s.phone.slice(-6) : '123456';
        }

        return {
          ...s,
          id: `imp-${Date.now()}-${idx}`,
          role: 'STUDENT',
          nickname: s.realName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.phone}`,
          accuracy: 0,
          mistakeCount: 0,
          studentPerms: ['BANK', 'VIDEO', 'EXAM']
        };
      });

      newStudents.forEach(st => onAdd(st));
      alert(`成功导入 ${newStudents.length} 名学员`);
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold" 
            placeholder="搜索姓名、手机号或工作单位..." 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm shrink-0 active:scale-95 transition-all">批量导入</button>
          <button onClick={() => { setEditingId(null); setForm({}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shrink-0 active:scale-95 transition-all">添加学员</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-black text-gray-800 mb-4 flex items-center justify-between text-xs uppercase tracking-widest">
          <span className="flex items-center gap-2 text-indigo-600"><i className="fa-solid fa-tags"></i> 自定义扩展字段</span>
          <div className="flex gap-2">
            <input className="text-xs border rounded-xl px-3 py-1.5 font-medium outline-none" placeholder="字段名" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
            <button onClick={() => { if(newFieldName) { onAddField(newFieldName); setNewFieldName(''); }}} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">新增</button>
          </div>
        </h3>
        <div className="flex flex-wrap gap-2">
          {customFields.map(cf => (
            <div key={cf} className="bg-gray-50 text-gray-500 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border">
              {cf} 
              <button onClick={() => onRemoveField(cf)} className="text-gray-300 hover:text-rose-500"><i className="fa-solid fa-circle-xmark"></i></button>
            </div>
          ))}
          {customFields.length === 0 && <span className="text-gray-300 text-xs italic">暂未设置扩展字段</span>}
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">姓名/头像</th>
              <th className="px-6 py-4">手机号</th>
              <th className="px-6 py-4">班级</th>
              <th className="px-6 py-4">工作单位</th>
              <th className="px-6 py-4">学历/专业</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((s) => (
              <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {s.avatar ? (
                      <img src={s.avatar} className="w-10 h-10 rounded-xl shadow-sm border border-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl shadow-sm border border-white bg-gray-100 flex items-center justify-center text-indigo-600 font-black">{(s.realName || s.nickname || '学')[0]}</div>
                    )}
                    <div>
                      <button onClick={() => { setEditingId(s.id); setForm(s); setIsModalOpen(true); }} className="font-bold text-gray-900 hover:text-indigo-600 underline decoration-gray-200 underline-offset-4">{s.realName}</button>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{s.idCard || '无身份证'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{s.phone}</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-indigo-600">{s.className || '--'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.company || '--'}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-800">{s.educationLevel || '--'}</div>
                  <div className="text-[10px] text-indigo-500 font-black">{s.major || '--'}</div>
                </td>
                <td className="px-6 py-4 text-center">
                   <button onClick={() => { if(confirm(`确定删除学员「${s.realName}」吗？`)) onDelete([s.id]); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><i className="fa-solid fa-trash-can"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 分页控制 */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400">共 {filtered.length} 名学员，当前第 {currentPage} / {totalPages} 页</div>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              )).filter((_, i) => Math.abs(i + 1 - currentPage) < 3 || i === 0 || i === totalPages - 1)}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] shadow-2xl no-scrollbar">
            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <i className="fa-solid fa-user-plus text-indigo-600"></i>
              {editingId ? '编辑学员档案' : '录入新学员'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">真实姓名 *</label>
                <input required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-indigo-100" value={form.realName || ''} onChange={e => setForm({...form, realName: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">手机号 *</label>
                <input required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-indigo-100" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">性别</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">身份证号</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-indigo-100" value={form.idCard || ''} onChange={e => setForm({...form, idCard: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">登录密码</label>
                <input className="w-full bg-indigo-50/50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" type="password" placeholder={editingId ? '留空则不修改' : '默认手机号后6位'} value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">毕业院校</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.school || ''} onChange={e => setForm({...form, school: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">所学专业</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.major || ''} onChange={e => setForm({...form, major: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">学历性质</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.educationType || ''} onChange={e => setForm({...form, educationType: e.target.value})}>
                  <option value="">请选择</option>
                  {EDUCATION_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">最高学历</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.educationLevel || ''} onChange={e => setForm({...form, educationLevel: e.target.value})}>
                  <option value="">请选择</option>
                  {EDUCATION_LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">工作单位</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.company || ''} onChange={e => setForm({...form, company: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">所属班级</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.className || ''} onChange={e => setForm({...form, className: e.target.value})} placeholder="如：2024春季班" />
              </div>

              {customFields.map(cf => (
                <div key={cf} className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">{cf}</label>
                  <input className="w-full bg-indigo-50/30 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={form.customFields?.[cf] || ''} onChange={e => setForm({...form, customFields: {...(form.customFields||{}), [cf]: e.target.value}})} />
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">保存档案</button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">批量录入学员档案</h3>
            <p className="text-xs text-gray-400 mb-8">上传 CSV 电子表格以快速向系统中批量录入学员档案信息。</p>
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition-colors group"
              >
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-indigo-400 mb-4 group-hover:scale-110 transition-transform"></i>
                <div className="text-sm font-bold text-indigo-600">点击此处上传学员名单</div>
                <div className="text-[10px] text-gray-400 mt-2">支持标准 CSV 表格文件</div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBatchImport} />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">填写规范说明</h4>
                <ul className="text-[11px] text-amber-700/80 space-y-1.5 list-disc pl-4">
                  <li>表头必须严格按照模板中的列名排列</li>
                  <li>带 * 号的字段（姓名、手机号）为必选项</li>
                  <li>若不填写密码，系统默认为其手机号后6位</li>
                </ul>
              </div>

              <button 
                onClick={handleDownloadTemplate}
                className="w-full py-4 border-2 border-gray-100 text-gray-500 rounded-2xl text-xs font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i> 下载标准 CSV 导入模板
              </button>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
