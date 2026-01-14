import React from 'react';
import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

/**
 * 富文本内容显示组件
 * 用于安全地渲染包含 HTML 和图片的内容
 */
const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
  // 如果内容为空，返回空
  if (!content || content.trim() === '') {
    return null;
  }

  // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'span', 'div', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['style', 'src', 'alt', 'class'],
    ALLOWED_STYLES: {
      '*': {
        'color': [/^#[0-9a-fA-F]{3,6}$/],
        'font-size': [/^\d+px$/],
        'text-align': [/^(left|center|right|justify)$/],
      }
    }
  });

  return (
    <>
      <div 
        className={`rich-text-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      <style>{`
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
          display: block;
        }
        .rich-text-content ul, .rich-text-content ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        .rich-text-content li {
          margin: 4px 0;
        }
        .rich-text-content p {
          margin: 4px 0;
        }
      `}</style>
    </>
  );
};

export default RichTextDisplay;
