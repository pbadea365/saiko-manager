const CACHE_NAME  = 'saiko-pms-v1';
const OFFLINE_URL = '/index.html';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore') || e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')   || e.request.url.includes('jsdelivr')) return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (e.request.method==='GET' && resp.status===200) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));
      }
      return resp;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match(OFFLINE_URL)))
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCQvrVCn7zYa39d6dFIOw9CcE-iVVAQaIA",
  authDomain:        "saiko-media.firebaseapp.com",
  projectId:         "saiko-media",
  storageBucket:     "saiko-media.firebasestorage.app",
  messagingSenderId: "226457269371",
  appId:             "1:226457269371:web:e054ad6a09794605839ede"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title||'Saiko PMS', {
    body: body||'', icon:'/icon-192.png', badge:'/icon-192.png',
    tag: payload.data?.topic||'general', renotify:true,
    data:{ url:'/' },
    actions:[{action:'open',title:'Deschide'},{action:'dismiss',title:'Închide'}]
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action==='dismiss') return;
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){ if(c.url.includes(self.location.origin)&&'focus' in c) return c.focus(); }
      return clients.openWindow('/');
    })
  );
});
