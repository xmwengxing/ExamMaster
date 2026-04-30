
import React, { useState, useRef } from 'react';
import { PracticalTask, PracticalPartType, PracticalTaskPart } from '../../types';
import { useAppStore } from '../../store';

const PracticalManager: React.FC = () => {
  const store = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PracticalTask | null>(null);
  const [isCodeCompletion, setIsCodeCompletion] = useState(false);
  
  // 用于存储textarea引用，以便插入占位符
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  
  const [form, setForm] = useState<{ title: string; parts: PracticalTaskPart[] }>({
    title: '',
    parts: []
  });

  const handleAddTask = () => {
    setEditingTask(null);
    setIsCodeCompletion(false);
    setForm({ title: '', parts: [] });
    setIsModalOpen(true);
  };

  const handleAddCodeCompletionTask = () => {
    setEditingTask(null);
    setIsCodeCompletion(true);
    setForm({ title: '', parts: [] });
    setIsModalOpen(true);
  };

  const handleEditTask = (task: PracticalTask) => {
    setEditingTask(task);
    // 判断是否是代码补全题（包含CODE或CODE_BLANK类型的部分）
    const hasCodeParts = task.parts.some(p => p.type === PracticalPartType.CODE || p.type === PracticalPartType.CODE_BLANK);
    setIsCodeCompletion(hasCodeParts);
    setForm({ title: task.title, parts: [...task.parts] });
    setIsModalOpen(true);
  };

  const addPart = (type: PracticalPartType) => {
    setForm(prev => ({
      ...prev,
      parts: [
        ...prev.parts,
        { id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, type, content: '' }
      ]
    }));
  };

  const removePart = (id: string) => {
    setForm(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== id)
    }));
  };

  const updatePartContent = (id: string, content: string) => {
    setForm(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === id ? { ...p, content } : p)
    }));
  };

  const insertPlaceholder = (partId: string) => {
    // 先获取最新的textarea引用
    const textarea = textareaRefs.current[partId];
    if (!textarea) {
      console.error('Textarea ref not found for part:', partId);
      return;
    }

    // 获取当前部分
    const part = form.parts.find(p => p.id === partId);
    if (!part || part.type !== PracticalPartType.CODE) {
      console.error('Part not found or not a code type:', partId);
      return;
    }

    // 获取当前光标位置
    const cursorPos = textarea.selectionStart;
    console.log('Cursor position:', cursorPos);
    
    const textBefore = part.content.substring(0, cursorPos);
    const textAfter = part.content.substring(cursorPos);

    // 计算新的占位符编号
    const placeholderRegex = /<(\d+)>/g;
    let maxNumber = 0;
    let match;
    const contentCopy = part.content;
    while ((match = placeholderRegex.exec(contentCopy)) !== null) {
      const number = parseInt(match[1]);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
    const newNumber = maxNumber + 1;
    console.log('New placeholder number:', newNumber);

    // 插入新的占位符
    const newContent = textBefore + `<${newNumber}>` + textAfter;
    console.log('New content:', newContent);
    
    updatePartContent(partId, newContent);

    // 重新设置光标位置到占位符后面
    setTimeout(() => {
      // 重新获取textarea引用，因为DOM可能已经更新
      const updatedTextarea = textareaRefs.current[partId];
      if (updatedTextarea) {
        updatedTextarea.focus();
        const newCursorPos = cursorPos + `<${newNumber}>`.length;
        updatedTextarea.selectionStart = updatedTextarea.selectionEnd = newCursorPos;
        console.log('Updated cursor position:', newCursorPos);
      }
    }, 0);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('请填写实操标题');
      return;
    }
    const task: PracticalTask = {
      id: editingTask?.id || `pt-${Date.now()}`,
      title: form.title,
      parts: form.parts,
      createdAt: editingTask?.createdAt || new Date().toLocaleString()
    };
    if (editingTask) {
      // 编辑模式：更新现有实操题
      await store.updatePracticalTask(task);
    } else {
      // 新建模式：创建新实操题
      await store.addPracticalTask(task);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">实操题管理中心</h2>
          <p className="text-xs text-gray-400 font-medium">支持论述、代码、简答等开放式实操题型</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAddTask}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            发布新实操
          </button>
          <button 
            onClick={() => handleAddCodeCompletionTask()}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            发布代码补全
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.practicalTasks.map(task => (
          <div key={task.id} className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                <i className="fa-solid fa-code"></i>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditTask(task)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button 
                  onClick={() => { if(confirm('确定删除此实操题吗？')) store.deletePracticalTask(task.id); }}
                  className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">{task.title}</h3>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              包含 {task.parts.length} 个内容栏 · {task.createdAt}
            </div>
          </div>
        ))}
        {store.practicalTasks.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-300 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
            <i className="fa-solid fa-keyboard text-4xl mb-4 opacity-20"></i>
            <p className="font-bold">暂无实操题目，点击上方按钮发布</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">{editingTask ? '编辑实操题' : '发布新实操'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">实操标题</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-100"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="例如：基于 React 的购物车功能实现"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">内容构造区</h4>
                   <div className="flex flex-wrap gap-2">
                  {isCodeCompletion ? (
                    <>
                      <button onClick={() => addPart(PracticalPartType.CODE)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100">代码片段</button>
                      <button onClick={() => addPart(PracticalPartType.CODE_BLANK)} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black border border-purple-100">代码填空</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => addPart(PracticalPartType.STEM)} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100">新增题干</button>
                      <button onClick={() => addPart(PracticalPartType.BLANK)} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-gray-100">新增填空栏</button>
                      <button onClick={() => addPart(PracticalPartType.ANSWER)} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black hover:bg-amber-50 hover:text-amber-600 transition-all border border-gray-100">添加参考答案</button>
                    </>
                  )}
                </div>
                </div>

                <div className="space-y-6">
                  {form.parts.map((part, index) => (
                    <div key={part.id} className="relative group p-6 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-white border-2 flex items-center justify-center font-black text-[10px] text-gray-400 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                          part.type === PracticalPartType.STEM ? 'bg-gray-100 text-gray-500' :
                          part.type === PracticalPartType.BLANK ? 'bg-emerald-50 text-emerald-600' :
                          part.type === PracticalPartType.ANSWER ? 'bg-amber-50 text-amber-600' :
                          part.type === PracticalPartType.CODE ? 'bg-blue-50 text-blue-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {part.type === PracticalPartType.STEM ? '题干描述' :
                           part.type === PracticalPartType.BLANK ? '填空栏位' :
                           part.type === PracticalPartType.ANSWER ? '参考答案' :
                           part.type === PracticalPartType.CODE ? '代码片段' : '代码填空'}
                        </span>
                        <div className="flex gap-2">
                          {part.type === PracticalPartType.CODE && (
                            <button 
                              onClick={() => insertPlaceholder(part.id)}
                              className="text-blue-400 hover:text-blue-600 p-1 transition-all"
                              title="在光标位置插入占位符"
                            >
                              <i className="fa-solid fa-plus-square"></i>
                            </button>
                          )}
                          <button onClick={() => removePart(part.id)} className="text-rose-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                            <i className="fa-solid fa-circle-xmark"></i>
                          </button>
                        </div>
                      </div>
                      <textarea 
                        ref={(el) => textareaRefs.current[part.id] = el}
                        className="w-full bg-white rounded-2xl p-5 text-sm font-mono h-32 outline-none focus:ring-2 focus:ring-indigo-100 border border-gray-50 resize-y"
                        value={part.content}
                        onChange={e => updatePartContent(part.id, e.target.value)}
                        placeholder={
                          part.type === PracticalPartType.STEM ? '填写题目要求或场景背景...' :
                          part.type === PracticalPartType.BLANK ? '此项将由学员填写。此处可填写默认提示词或占位符...' :
                          part.type === PracticalPartType.ANSWER ? '填写标准答案或代码示例，提交后展示给学员...' :
                          part.type === PracticalPartType.CODE ? '输入代码片段，学员不可修改...\n\n示例：model = tf.keras.<1>.load_model('<2>')' :
                          '学员将在此处填写代码...'
                        }
                      />
                    </div>
                  ))}
                  {form.parts.length === 0 && (
                    <div className="py-20 text-center text-gray-300 border-2 border-dashed border-gray-50 rounded-[2.5rem]">
                      请点击上方按钮开始构造实操题内容
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-dashed flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalManager;
