/**
 * Service Worker para cache offline em produção HTTPS
 * Melhora a performance e resolve problemas de conectividade
 */

const CACHE_NAME = 'meu-dinheiro-v1';
const STATIC_CACHE = 'static-v1';

// Arquivos essenciais para cache
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Cache criado');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker: Erro no cache inicial:', error);
      })
  );
  
  // Ativar imediatamente
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Controlar todas as abas imediatamente
  return self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Ignorar WebSocket e requests de desenvolvimento
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || 
      url.pathname.includes('__vite') || 
      url.pathname.includes('@vite') ||
      url.pathname.includes('hot-update')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }
        
        // Fazer request normal
        return fetch(request)
          .then((response) => {
            // Não cachear se não for uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cachear apenas recursos estáticos
            if (request.method === 'GET' && 
                (url.pathname.endsWith('.js') || 
                 url.pathname.endsWith('.css') || 
                 url.pathname.endsWith('.png') || 
                 url.pathname.endsWith('.jpg') || 
                 url.pathname.endsWith('.svg') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('.html'))) {
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.warn('⚠️ Service Worker: Erro no fetch:', error);
            
            // Retornar página offline para navegação
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker: Carregado e pronto!');