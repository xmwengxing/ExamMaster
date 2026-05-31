import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'u', 's', 'del', 'code', 'pre',
  'blockquote',
  'a',
  'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id', 'style'];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export async function sanitizeMarkdown(markdown: string): Promise<string> {
  const { marked } = await import('marked');
  const html = marked.parse(markdown) as string;
  return sanitizeHtml(html);
}