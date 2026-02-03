/**
 * Service Worker - PWA 离线缓存
 * 
 * 功能：
 * - 缓存静态资源（JS、CSS、字体、图片）
 * - 离线访问支持
 * - 自动更新缓存
 */

const CACHE_NAME = 'edumaster-v1.0.1-20260128';
const RUNTIME_CACHE = 'edumaster-runtime-v1.0.1';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
];

// 需要缓存的资源类型
const CACHEABLE_EXTENSIONS = [
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] 安装完成');
        // 立即激活新的 Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 安装失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本的缓存
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 激活完成');
        // 立即控制所有页面
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 不缓存 API 请求
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // 检查是否是可缓存的资源
  const isCacheable = CACHEABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
  
  if (isCacheable || url.pathname === '/' || url.pathname === '/index.html') {
    // 缓存优先策略（Cache First）
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] 缓存命中:', url.pathname);
            return cachedResponse;
          }
          
          // 缓存未命中，从网络获取
          console.log('[SW] 缓存未命中，从网络获取:', url.pathname);
          return fetch(request)
            .then((response) => {
              // 检查响应是否有效
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应（因为响应只能使用一次）
              const responseToCache = response.clone();
              
              // 缓存响应
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[SW] 已缓存:', url.pathname);
                });
              
              return response;
            })
            .catch((error) => {
              console.error('[SW] 网络请求失败:', url.pathname, error);
              
              // 如果是 HTML 请求，返回离线页面
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              throw error;
            });
        })
    );
  }
});

// 消息事件 - 手动触发缓存更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] 收到跳过等待消息');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] 收到清除缓存消息');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] 删除缓存:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

console.log('[SW] Service Worker 已加载');
