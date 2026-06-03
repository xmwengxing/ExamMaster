import React, { useState, useEffect } from 'react';

interface CourseGroup {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  sort_order: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  base_path: string;
  cover_image?: string;
  status: 'published' | 'draft';
  sort_order: number;
  group_id: string;
  group_title?: string;
  start_chapter?: number;
}

const authHeaders = () => {
  const token = localStorage.getItem('edu_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function InteractiveCourseManager() {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Chapter modal
  const [chModalOpen, setChModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chForm, setChForm] = useState({ title: '', description: '', base_path: 'courses/ai-trainer/', cover_image: '', status: 'draft' as 'draft' | 'published', sort_order: 0, start_chapter: 0 });

  // Group modal
  const [grpModalOpen, setGrpModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroup | null>(null);
  const [grpForm, setGrpForm] = useState({ title: '', description: '', cover_image: '', sort_order: 0 });

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/interactive-courses/groups', { headers: authHeaders() });
      const data = await res.json();
      const gs = Array.isArray(data.groups) ? data.groups : [];
      setGroups(gs);
      if (!selectedGroupId && gs.length > 0) setSelectedGroupId(gs[0].id);
    } catch (e) { console.error(e); }
  };

  const loadChapters = async (groupId: string) => {
    if (!groupId) { setChapters([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/interactive-courses/chapters?group_id=${groupId}`, { headers: authHeaders() });
      const data = await res.json();
      setChapters(Array.isArray(data.chapters) ? data.chapters : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { loadChapters(selectedGroupId); }, [selectedGroupId]);

  const syncDetect = async () => {
    if (!selectedGroupId) return;
    setSyncMsg('正在检测...');
    try {
      const res = await fetch('/api/interactive-courses/detect', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ group_id: selectedGroupId }),
      });
      const data = await res.json();
      if (data.created?.length > 0) {
        setSyncMsg(`✓ 已添加 ${data.created.length} 个新课：${data.created.map((c: any) => c.title).join('、')}`);
        loadChapters(selectedGroupId);
      } else {
        setSyncMsg(data.message || '未发现新课件目录');
      }
    } catch (e) { setSyncMsg('检测失败'); }
    setTimeout(() => setSyncMsg(''), 5000);
  };

  // --- Chapter CRUD ---
  const openCreateChapter = () => {
    setEditingChapter(null);
    setChForm({ title: '', description: '', base_path: 'courses/ai-trainer/', cover_image: '', status: 'draft', sort_order: chapters.length + 1, start_chapter: 0 });
    setChModalOpen(true);
  };
  const openEditChapter = (c: Chapter) => {
    setEditingChapter(c);
    setChForm({ title: c.title, description: c.description, base_path: c.base_path, cover_image: c.cover_image || '', status: c.status, sort_order: c.sort_order, start_chapter: c.start_chapter || 0 });
    setChModalOpen(true);
  };
  const saveChapter = async () => {
    const method = editingChapter ? 'PUT' : 'POST';
    const url = editingChapter ? `/api/interactive-courses/chapters/${editingChapter.id}` : '/api/interactive-courses/chapters';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify({ ...chForm, group_id: selectedGroupId }) });
    if (res.ok) { setChModalOpen(false); loadChapters(selectedGroupId); }
    else alert('保存失败');
  };
  const deleteChapter = async (id: string) => {
    if (!confirm('确定删除此章节？')) return;
    await fetch(`/api/interactive-courses/chapters/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadChapters(selectedGroupId);
  };

  // --- Group CRUD ---
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGrpForm({ title: '', description: '', cover_image: '', sort_order: groups.length + 1 });
    setGrpModalOpen(true);
  };
  const openEditGroup = (g: CourseGroup) => {
    setEditingGroup(g);
    setGrpForm({ title: g.title, description: g.description, cover_image: g.cover_image || '', sort_order: g.sort_order });
    setGrpModalOpen(true);
  };
  const saveGroup = async () => {
    const method = editingGroup ? 'PUT' : 'POST';
    const url = editingGroup ? `/api/interactive-courses/groups/${editingGroup.id}` : '/api/interactive-courses/groups';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(grpForm) });
    if (res.ok) { setGrpModalOpen(false); loadGroups(); }
    else alert('保存失败');
  };
  const deleteGroup = async (id: string) => {
    if (!confirm('确定删除此课程及其所有章节？')) return;
    await fetch(`/api/interactive-courses/groups/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (selectedGroupId === id) setSelectedGroupId('');
    loadGroups();
  };

  const statusText = (s: string) => s === 'published' ? '已上架' : '草稿';

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>交互式课堂管理</h2>
        <button onClick={openCreateGroup} style={{ padding: '8px 20px', background: '#4361ee', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          + 新增课程
        </button>
      </div>

      {/* 课程组标签 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {groups.map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedGroupId(g.id)}
              style={{
                padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                background: selectedGroupId === g.id ? '#4361ee' : '#e8e8e8',
                color: selectedGroupId === g.id ? '#fff' : '#333',
                fontWeight: selectedGroupId === g.id ? 600 : 400,
              }}
            >
              {g.title}
            </button>
            <button onClick={() => openEditGroup(g)} style={{ ...btnSm, marginLeft: 4, color: '#4361ee', fontSize: 12 }}>编辑</button>
            <button onClick={() => deleteGroup(g.id)} style={{ ...btnSm, fontSize: 12, color: '#e00' }}>删除</button>
          </div>
        ))}
        {groups.length === 0 && <span style={{ color: '#999', fontSize: 14 }}>暂无课程，请先新增课程</span>}
      </div>

      {/* 章节表 */}
      {selectedGroupId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              章节列表 — {groups.find(g => g.id === selectedGroupId)?.title || ''}
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={openCreateChapter} style={{ padding: '6px 16px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                + 新增章节
              </button>
              <button onClick={syncDetect} style={{ padding: '6px 16px', background: '#4361ee', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                同步课件章节
              </button>
            </div>
          </div>
          {syncMsg && <div style={{ padding: '8px 16px', marginBottom: 12, background: syncMsg.startsWith('✓') ? '#f6ffed' : '#fff7e6', border: '1px solid ' + (syncMsg.startsWith('✓') ? '#b7eb8f' : '#ffd591'), borderRadius: 6, fontSize: 14, color: '#333' }}>{syncMsg}</div>}
          {loading ? <p>加载中...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                  <th style={th}>排序</th><th style={th}>章节标题</th><th style={th}>路径</th><th style={th}>状态</th><th style={th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>{c.sort_order}</td>
                    <td style={td}>{c.title}</td>
                    <td style={td}>{c.base_path}</td>
                    <td style={td}>{statusText(c.status)}</td>
                    <td style={td}>
                      <button onClick={() => openEditChapter(c)} style={btn}>编辑</button>
                      <button onClick={() => deleteChapter(c.id)} style={{ ...btn, color: '#e00' }}>删除</button>
                    </td>
                  </tr>
                ))}
                {chapters.length === 0 && (
                  <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#999' }}>暂无章节</td></tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 章节 Modal */}
      {chModalOpen && (
        <Modal onClose={() => setChModalOpen(false)} title={editingChapter ? '编辑章节' : '新增章节'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>章节标题 <input value={chForm.title} onChange={e => setChForm({...chForm, title: e.target.value})} style={inp} /></label>
            <label>描述 <textarea value={chForm.description} onChange={e => setChForm({...chForm, description: e.target.value})} style={inp} rows={3} /></label>
            <label>构建产物路径 <input value={chForm.base_path} onChange={e => setChForm({...chForm, base_path: e.target.value})} style={inp} placeholder="courses/ai-trainer/" /></label>
            <label>封面图 URL <input value={chForm.cover_image} onChange={e => setChForm({...chForm, cover_image: e.target.value})} style={inp} /></label>
            <label>排序 <input type="number" value={chForm.sort_order} onChange={e => setChForm({...chForm, sort_order: parseInt(e.target.value) || 0})} style={inp} /></label>
            <label>起始章节 <input type="number" value={chForm.start_chapter} onChange={e => setChForm({...chForm, start_chapter: parseInt(e.target.value) || 0})} style={inp} placeholder="0 = 从第一节开始" /></label>
            <label>状态 <select value={chForm.status} onChange={e => setChForm({...chForm, status: e.target.value as any})} style={inp}>
              <option value="draft">草稿</option><option value="published">已上架</option>
            </select></label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={() => setChModalOpen(false)} style={{ ...btn, background: '#eee' }}>取消</button>
            <button onClick={saveChapter} style={{ ...btn, background: '#4361ee', color: '#fff' }}>保存</button>
          </div>
        </Modal>
      )}

      {/* 课程 Modal */}
      {grpModalOpen && (
        <Modal onClose={() => setGrpModalOpen(false)} title={editingGroup ? '编辑课程' : '新增课程'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>课程名称 <input value={grpForm.title} onChange={e => setGrpForm({...grpForm, title: e.target.value})} style={inp} /></label>
            <label>课程简介 <textarea value={grpForm.description} onChange={e => setGrpForm({...grpForm, description: e.target.value})} style={inp} rows={3} /></label>
            <label>封面图 URL <input value={grpForm.cover_image} onChange={e => setGrpForm({...grpForm, cover_image: e.target.value})} style={inp} /></label>
            <label>排序 <input type="number" value={grpForm.sort_order} onChange={e => setGrpForm({...grpForm, sort_order: parseInt(e.target.value) || 0})} style={inp} /></label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={() => setGrpModalOpen(false)} style={{ ...btn, background: '#eee' }}>取消</button>
            <button onClick={saveGroup} style={{ ...btn, background: '#4361ee', color: '#fff' }}>保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 500, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 20 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '12px 16px', fontSize: 14, fontWeight: 600, borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '10px 16px', fontSize: 14 };
const btn: React.CSSProperties = { padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, background: 'transparent' };
const btnSm: React.CSSProperties = { padding: '2px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' };
const inp: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginTop: 4 };
