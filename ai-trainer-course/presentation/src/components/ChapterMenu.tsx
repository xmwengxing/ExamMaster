import { useState } from "react";
import "./ChapterMenu.css";

export interface ChapterEntry {
  id: string;
  title: string;
}
export interface SegmentDef {
  id: string;
  title: string;
  chapters: ChapterEntry[];
}
export interface SectionDef {
  id: string;
  title: string;
  segments: SegmentDef[];
}
export interface CourseDef {
  courseId: string;
  title: string;
  sections: SectionDef[];
}

interface Props {
  course: CourseDef;
  activeChapterId: string;
  onJumpChapter: (chapterId: string) => void;
}

export function ChapterMenu({ course, activeChapterId, onJumpChapter }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["1.1"]));

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleChapterClick = (chId: string) => {
    onJumpChapter(chId);
  };

  // Find which section & segment contains active chapter for auto-expand
  const activeSegmentId = (() => {
    for (const sec of course.sections)
      for (const seg of sec.segments)
        if (seg.chapters.some((c) => c.id === activeChapterId)) return seg.id;
    return null;
  })();

  return (
    <div className={`cm-sidebar ${expanded ? "cm-expanded" : ""}`} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <div className="cm-toggle">
        <span className="cm-toggle-icon">☰</span>
        {expanded && <span className="cm-toggle-label">课程目录</span>}
      </div>
      {expanded && (
        <div className="cm-content">
          <span className="cm-title">{course.title}</span>
          {course.sections.map((sec) => (
            <div key={sec.id} className="cm-section">
              <button
                className={`cm-section-btn ${expandedSections.has(sec.id) ? "cm-open" : ""}`}
                onClick={() => toggleSection(sec.id)}
              >
                <span className="cm-section-arrow">{expandedSections.has(sec.id) ? "▾" : "▸"}</span>
                <span className="cm-section-title">{sec.id}. {sec.title}</span>
              </button>
              {expandedSections.has(sec.id) && sec.segments.map((seg) => {
                const isActive = seg.id === activeSegmentId;
                return (
                  <div key={seg.id} className="cm-segment">
                    <button
                      className={`cm-segment-btn ${isActive ? "cm-segment-active" : ""}`}
                      onClick={() => {
                        const first = seg.chapters[0];
                        if (first) handleChapterClick(first.id);
                      }}
                    >
                      <span className="cm-segment-title">{seg.id} {seg.title}</span>
                    </button>
                    <div className="cm-chapters">
                      {seg.chapters.map((ch) => (
                        <button
                          key={ch.id}
                          className={`cm-chapter-btn ${ch.id === activeChapterId ? "cm-chapter-active" : ""}`}
                          onClick={() => handleChapterClick(ch.id)}
                        >
                          {ch.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
