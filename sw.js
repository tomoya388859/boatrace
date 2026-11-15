// boat race：通知を受け取って表示する。データの鍵（type: key）もここで受け取って保存する
function appDb() {
  return new Promise((res, rej) => {
    const q = indexedDB.open('boat-app', 1);
    q.onupgradeneeded = () => { const d = q.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
async function setKv(k, v) {
  const d = await appDb();
  await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = { title: 'boat race', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    if (p.type === 'key') {
      await setKv('dataKey', p.key);
      if (p.repo) await setKv('repo', p.repo);
      if (p.token) await setKv('ghToken', p.token);
    }
    await self.registration.showNotification(p.title || 'boat race', {
      body: p.body || '', tag: p.id || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { id: p.id, type: p.type }
    });
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type: 'refresh' });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (cs.length) { cs[0].focus(); cs[0].postMessage({ type: 'refresh' }); }
    else await self.clients.openWindow('./');
  })());
});
