
import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isComposingRef = useRef(false); // 用于跟踪是否正在输入中文

  // 只在初始化或外部值变化且编辑器未聚焦时更新内容
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      const currentContent = editorRef.current.innerHTML;
      const newContent = value || '';
      
      // 只有在内容真正不同时才更新（避免光标位置丢失）
      if (currentContent !== newContent) {
        editorRef.current.innerHTML = newContent;
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current && !isComposingRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // 处理中文输入法
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    handleInput();
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // 压缩图片
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 创建 canvas 进行压缩
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 限制最大尺寸为 800px
          const maxSize = 800;
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
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 canvas 上下文'));
            return;
          }
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为 base64，质量设置为 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          // 检查压缩后的大小
          const sizeInKB = (compressedBase64.length * 3) / 4 / 1024;
          if (sizeInKB > 300) {
            // 如果还是太大，降低质量
            const finalBase64 = canvas.toDataURL('image/jpeg', 0.5);
            resolve(finalBase64);
          } else {
            resolve(compressedBase64);
          }
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持 JPG、PNG、GIF、WebP 格式的图片');
      e.target.value = '';
      return;
    }

    // 验证文件大小（限制 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(`图片大小不能超过 5MB\n当前图片: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      e.target.value = '';
      return;
    }

    try {
      // 压缩图片
      const base64 = await compressImage(file);
      
      // 创建图片元素并插入到光标位置
      const img = document.createElement('img');
      img.src = base64;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '8px';
      img.style.margin = '8px 0';
      img.style.cursor = 'pointer';
      img.setAttribute('contenteditable', 'false'); // 图片本身不可编辑
      
      // 插入图片
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        
        // 在图片后添加一个空格，方便继续输入
        const space = document.createTextNode('\u00A0');
        range.collapse(false);
        range.insertNode(space);
        range.setStartAfter(space);
        range.setEndAfter(space);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // 如果没有选区，直接追加到末尾
        editorRef.current?.appendChild(img);
        editorRef.current?.appendChild(document.createTextNode('\u00A0'));
      }
      
      // 触发更新
      handleInput();
    } catch (error) {
      alert('图片处理失败：' + (error as Error).message);
    }
    
    e.target.value = '';
  };

  const setFontSize = (size: string) => {
    // 使用 span 标签和内联样式，更可靠
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      
      // 触发 input 事件以保存更改
      editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const setTextColor = (color: string) => {
    // 使用 span 标签和内联样式
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const span = document.createElement('span');
      span.style.color = color;
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      
      // 触发 input 事件以保存更改
      editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const toolbarButtons = [
    {
      group: '字体样式',
      buttons: [
        { icon: 'fa-bold', command: 'bold', title: '加粗' },
        { icon: 'fa-italic', command: 'italic', title: '斜体' },
        { icon: 'fa-underline', command: 'underline', title: '下划线' },
        { icon: 'fa-strikethrough', command: 'strikeThrough', title: '删除线' },
      ]
    },
    {
      group: '对齐',
      buttons: [
        { icon: 'fa-align-left', command: 'justifyLeft', title: '左对齐' },
        { icon: 'fa-align-center', command: 'justifyCenter', title: '居中对齐' },
        { icon: 'fa-align-right', command: 'justifyRight', title: '右对齐' },
        { icon: 'fa-align-justify', command: 'justifyFull', title: '两端对齐' },
      ]
    },
    {
      group: '列表',
      buttons: [
        { icon: 'fa-list-ul', command: 'insertUnorderedList', title: '无序列表' },
        { icon: 'fa-list-ol', command: 'insertOrderedList', title: '有序列表' },
      ]
    },
  ];

  const fontSizes = [
    { label: '小', value: '12px' },
    { label: '正常', value: '14px' },
    { label: '中', value: '16px' },
    { label: '大', value: '20px' },
    { label: '特大', value: '24px' },
  ];

  const colors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#FF6B00', '#FFD700', '#00FF00',
    '#0000FF', '#4B0082', '#9400D3', '#FF1493',
  ];

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${isFocused ? 'border-indigo-300 shadow-lg shadow-indigo-100' : 'border-gray-100'}`}>
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b border-gray-100 p-3 space-y-3">
        {/* 第一行：字体样式和对齐 */}
        <div className="flex flex-wrap items-center gap-2">
          {toolbarButtons.map((group, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <div className="w-px h-6 bg-gray-200"></div>}
              <div className="flex gap-1">
                {group.buttons.map((btn, btnIdx) => (
                  <button
                    key={btnIdx}
                    type="button"
                    onClick={() => execCommand(btn.command)}
                    className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-gray-600 hover:text-indigo-600"
                    title={btn.title}
                  >
                    <i className={`fa-solid ${btn.icon} text-sm`}></i>
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* 第二行：字体大小、颜色、图片 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 字体大小 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase">大小</span>
            <div className="flex gap-1">
              {fontSizes.map((size, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-indigo-600"
                  title={`字体大小: ${size.label}`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* 字体颜色 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase">颜色</span>
            <div className="flex gap-1">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTextColor(color)}
                  className="w-6 h-6 rounded-lg border-2 border-white hover:border-gray-300 transition-all shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`颜色: ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* 插入图片 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-xs font-bold text-gray-600 hover:text-indigo-600"
            title="插入图片"
          >
            <i className="fa-solid fa-image"></i>
            <span>插入图片</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* 清除格式 */}
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all text-xs font-bold text-gray-400 hover:text-rose-600"
            title="清除格式"
          >
            <i className="fa-solid fa-eraser"></i>
            <span>清除格式</span>
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-5 outline-none text-sm leading-relaxed"
        style={{ wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
          cursor: pointer;
          display: inline-block;
          vertical-align: middle;
        }
        [contenteditable] img:hover {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }
        [contenteditable] img::selection {
          background: rgba(99, 102, 241, 0.3);
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
