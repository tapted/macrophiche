workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

const imgCacheReady = caches.open('img-cache');
async function asyncFetch(params, key, resolve, reject) {
  try {
    const imgCache = await imgCacheReady;
    if (!params.force) {
      const response = await imgCache.match(key);
      if (response) {
        resolve(response);
        console.log(`Cached response.`);
        return;
      }
    }
    const response = await fetch(params.url, {mode: 'no-cors'});
    const responseToCache = response.clone();
    resolve(response);
    // Note: Eached cached opaque response takes up 7MB of quota.
    // The Photos API sends Access-Control-Expose-Headers: Content-Length,
    // but there doesn't seem to be any way to use it for an opaque response.
    // (The API response doesn't allow any origins either, so setting that
    // header seems to be useless?).
    imgCache.put(key, responseToCache);
    console.log(`Fetched. Cached. forced=${params.force}.`);
  } catch (e) {
    reject(e);
  }
}

const matchImgProxy = ({url, event}) => {
  return url.pathname.startsWith('/imgproxy/');
};

const imgProxyHandler = ({url, event, params}) => {
  const [, , photo, album] = url.pathname.split('/');
  const args = {};
  url.search.substr(1).split('&').forEach((item) => {
    const pair = item.split('=');
    args[pair[0]] = decodeURIComponent(pair[1]);
  });
  const key = new Request(event.request.url.split('?')[0]);
  return new Promise((resolve, reject) => {
    asyncFetch(args, key, resolve, reject);
  });
};

workbox.routing.registerRoute(
  matchImgProxy,
  imgProxyHandler
);

self.addEventListener('message', (event) => {
  if (!event.data)
    return;

  switch (event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    default:
      break;
  }
});
