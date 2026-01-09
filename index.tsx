
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { marked } from 'marked';

// 初始化并注册 Markdown 渲染器，兼容旧代码通过 window.marked 调用
const initMarked = () => {
  try {
    (window as any).marked = marked;
    const options = {
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    };
    if (typeof marked.setOptions === 'function') marked.setOptions(options);
    else if (typeof (marked as any).use === 'function') (marked as any).use(options);
  } catch (e) {
    console.warn('[initMarked] failed to initialize marked', e);
  }
};

initMarked();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
