/* LHR21.2 QA/QC form - offline copy. Build: 27/10/2026 – v14 outstanding filter (e951072ea8)
   Opens from the copy on the phone first, so it works with no signal; when there is signal a newer
   copy is fetched in the background and used the next time the form is opened. The shared copy
   (/api/...) always goes to the site and is never kept here. */
const CACHE = "lhr212-qaqc-e951072ea8";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("lhr212-qaqc-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true}) ||
                (req.mode === "navigate" ? await cache.match("index.html") : undefined);
    const fresh = fetch(req).then(r => { if(r && r.ok && r.type === "basic") cache.put(req, r.clone()); return r; })
                            .catch(() => undefined);
    if(hit){ e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response("Offline - open the form once with signal first.", {status: 503});
  }));
});
