const CACHE_NAME = 'coffee-pos-v1'
const OFFLINE_URL = '/'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

const CACHE_API_ENDPOINTS = [
  '/api/pos/menu-items',
  '/api/pos/categories',
  '/api/pos/orders',
  '/api/reports/sales',
  '/api/reports/custom',
  '/api/ai/insights',
  '/api/ai/suggestions'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
  } else {
    // Handle page requests
    event.respondWith(handlePageRequest(request))
  }
})

async function handlePageRequest(request) {
  const url = new URL(request.url)
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    try {
      const response = await fetch(request)
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
      return response
    } catch (error) {
      const offlineResponse = await caches.match(OFFLINE_URL)
      return offlineResponse || new Response('Offline - Please check your connection', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    }
  }

  // Try cache first for static assets
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Network fallback
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

async function handleAPIRequest(request) {
  const url = new URL(request.url)

  // Check if this is a cacheable API endpoint
  const isCacheable = CACHE_API_ENDPOINTS.some(endpoint => 
    url.pathname.startsWith(endpoint)
  )

  if (!isCacheable) {
    return fetch(request)
  }

  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Return cached data in background and update
    fetchAndCache(request)
    return cachedResponse
  }

  // Network first with cache fallback
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return cached data if available
    return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function fetchAndCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
  } catch (error) {
    console.error('Background fetch failed:', error)
  }
}

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName))
    })
  }
})