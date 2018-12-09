workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

const thumbRegex = new RegExp('=w[0-9]*-h[0-9]*-c$');
const matchThumb = ({url, event}) => {
  if (!url.hostname.endsWith('googleusercontent.com'))
    return false;
  return thumbRegex.test(url.pathname);
};

workbox.routing.registerRoute(
  matchThumb,
  workbox.strategies.staleWhileRevalidate(),
);


const imgCacheReady = caches.open('img-cache');
const imgProxyHandler = async ({encodedUrl, event, params}) => {
  const [, photo, album, search] = encodedUrl.split('/');
  const params = {};
  search.split('?')[0].split('&').forEach((item) => {
    const pair = item.split('=');
    params[pair[0]] = decodeURIComponent(pair[1]);
  });
  console.log(encodedUrl);
  console.log(params);
  if (!params.force) {
    const kOptions = { ignoreSearch: true };
    const imgCache = await imgCacheReady;
    const response = await imgCache.match(event.request);
    if (response) {
      event.respondWith(response);
      console.log('cached response');
      return;
    }
  }
  //const realRequest = new Request(params.url);
  const response = await fetch(params.url);
  event.respondWith(response);
  const imgCache = await imgCacheReady;
  imgCache.put(event.request, response);
  console.log('fetched response, forced=' + params.force)
};

workbox.routing.registerRoute(
  new RegExp('/imgproxy/'),
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
