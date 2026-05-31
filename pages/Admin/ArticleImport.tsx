import React, { useState } from 'react';

interface ArticleImportProps {
  onBack: () => void;
  refreshAll: () => Promise<void>;
}

const ArticleImport: React.FC<ArticleImportProps> = ({ onBack, refreshAll }) => {
  const [sourceDir, setSourceDir] = useState('/home/shijingtian/workspace/projects/小白学python');
  const [courseTitle, setCourseTitle] = useState('小白学Python');
  const [teacherName, setTeacherName] = useState('水哥');
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/courses/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceDir })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '预览失败');
      }
      const data = await res.json();
      setPreviewData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!confirm(`确定要导入吗？这将创建课程「${courseTitle}」及其所有章节和课时。`)) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/courses/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceDir, courseTitle, teacherName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '导入失败');
      }
      const data = await res.json();
      setResult(data);
      await refreshAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">导入图文课程</h2>
          <p className="text-sm text-gray-400 font-bold">从 MkDocs 项目（如 小白学Python）导入 Markdown 课件</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Config */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-black text-sm text-gray-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-gear text-amber-500"></i> 导入配置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">源目录路径</label>
              <input
                value={sourceDir}
                onChange={e => setSourceDir(e.target.value)}
                placeholder="MkDocs 项目根目录路径 (含 mkdocs.yml)"
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-600/20"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-2">默认为 小白学Python 项目路径</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课程标题</label>
                <input
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-600/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">讲师姓名</label>
                <input
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-600/20"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {loading ? '解析中...' : '预览结构'}
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !previewData}
              className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all disabled:opacity-50"
            >
              {importing ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-600 font-bold">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
            </p>
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-black text-sm text-gray-700 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-eye text-emerald-500"></i> 导入预览
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-800">{previewData.chapters?.length || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-1">章节数</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-800">{previewData.totalLessons || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-1">课时数</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-800">{previewData.totalImages || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-1">图片数</div>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(previewData.chapters || []).map((ch: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-50">
                  <i className="fa-solid fa-folder text-amber-400 text-xs"></i>
                  <span className="font-bold text-gray-700">{ch.title}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{ch.lessonCount} 课时</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h3 className="font-black text-sm text-emerald-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i> 导入完成
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-xl font-black text-emerald-600">{result.summary?.chapters || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold">章节</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-xl font-black text-emerald-600">{result.summary?.lessons || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold">课时</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-xl font-black text-emerald-600">{result.summary?.images || 0}</div>
                <div className="text-[10px] text-gray-400 font-bold">图片</div>
              </div>
            </div>
            <p className="text-sm text-emerald-600 font-bold mt-3">
              课程已创建，可在「图文课程」中查看和编辑。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleImport;
