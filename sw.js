// 非常简单的 service worker：安装时缓存核心文件，之后优先使用缓存
const CACHE_NAME = 'find-diff-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js'
  // 如果有必要，把 assets 下的图片也列入缓存
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
