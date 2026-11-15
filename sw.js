/* Service worker: permite abrir as páginas sem rede (ex.: no comboio).
   - Páginas e ficheiros do site: tenta a rede (máx. 3 s) e, se falhar, usa a cópia guardada.
   - Fontes do Google: usa a cópia guardada se existir.
   Ao acrescentar uma página nova, junta-a a PRECACHE e muda VERSION. */
const VERSION = "v7";
const CACHE = "isa-" + VERSION;
const PRECACHE = [
  "/",
  "/estilo.css",
  "/portal.js",
  "/tema.js",
  "/icone.svg",
  "/filosofia/",
  "/filosofia/prova-comum-filosofia.html",
  "/filosofia/revisoes-introducao-determinismo-liberdade.html",
  "/geografia/",
  "/geografia/prova-comum-modulo-inicial-populacao.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("isa-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)); }

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  try {
    return await Promise.race([net, timeout(3000)]);
  } catch (_) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    return net; // sem cópia guardada: espera pela rede
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(req));
  }
});
