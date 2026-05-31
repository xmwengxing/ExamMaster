import React, { useState, useEffect } from 'react';

interface Chapter {
  id: string;
  title: string;
  description: string;
  base_path: string;
  cover_image?: string;
  group_id: string;
  start_chapter?: number;
}

interface CourseGroup {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  chapters: Chapter[];
}

export default function InteractiveCourseViewer() {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('edu_token');
    fetch('/api/interactive-courses/public', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setGroups(Array.isArray(data.groups) ? data.groups : []))
      .catch(console.error);
  }, []);

  const openChapter = (c: Chapter) => {
    const ch = c.start_chapter ?? 0;
    const url = `/${c.base_path}embed.html?auto=1&chapter=${ch}`.replace(/\/+/g, '/');
    window.open(url, '_blank');
  };

  // Level 2: chapter cards (after selecting a course)
  if (activeGroup) {
    return (
      <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setActiveGroup(null)} style={{ background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontSize: 15, padding: 0 }}>← 返回课程</button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{activeGroup.title}</h2>
        </div>
        {activeGroup.description && <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{activeGroup.description}</p>}
        {activeGroup.chapters.length === 0 ? (
          <p style={{ color: '#999' }}>暂无章节</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {activeGroup.chapters.map(c => (
              <div key={c.id}
                style={{ width: 300, border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onClick={() => openChapter(c)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ height: 160, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  {c.cover_image ? <img src={c.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{c.description || '暂无简介'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Level 1: course group cards
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>交互式课堂</h2>
      {groups.length === 0 ? (
        <p style={{ color: '#999' }}>暂无上架的课程</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {groups.map(g => (
            <div key={g.id}
              style={{ width: 300, border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => setActiveGroup(g)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ height: 160, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                {g.cover_image ? <img src={g.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎓'}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{g.title}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{g.description || '暂无简介'}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>{g.chapters.length} 个章节</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
