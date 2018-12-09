console.log('verbose loggin..');
workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

const thumbRegex = new RegExp('=w[0-9]*-h[0-9]*-c$');
const matchThumb = ({url, event}) => {
  console.log(url);
  if (!url.hostname.endsWith('googleusercontent.com'))
    return false;
  return thumbRegex.test(url.pathname);
};

//workbox.routing.registerRoute(
//  matchThumb,
//  workbox.strategies.staleWhileRevalidate(),
//);


const imgCacheReady = caches.open('img-cache');
const matchImgProxy = ({url, event}) => {
  return url.pathname.startsWith('/imgproxy/');
};
async function asyncFetch(params, event, resolve) {
  const key = new Request(event.request.url.split('?')[0]);
  if (!params.force) {
    const kOptions = { ignoreSearch: true };
    const imgCache = await imgCacheReady;
    const response = await imgCache.match(key, kOptions);
    if (response) {
      resolve(response);
      const length = response.headers.get('Content-Length');
      console.log(`Cached response (length=${length}).`);
      return;
    }
  }
  //const realRequest = new Request(params.url);
  const response = await fetch(params.url, {mode: 'no-cors'});
  const responseToCache = response.clone();
  resolve(response);
  const length = response.headers.get('Content-Length');
  if (length == null || length == 0) {
    console.log(`NOT caching: fetched response has:
      Content-Length=${length}, forced=${params.force}.`);
    return;
  }
  const imgCache = await imgCacheReady;
  imgCache.put(key, responseToCache);
  console.log(`fetched length=${length}, forced=${params.force}`);  
}
const imgProxyHandler = ({url, event, params}) => {
  const [, , photo, album] = url.pathname.split('/');
  const args = {};
  url.search.substr(1).split('&').forEach((item) => {
    const pair = item.split('=');
    args[pair[0]] = decodeURIComponent(pair[1]);
  });
  return new Promise((resolve, reject) => {
    asyncFetch(args, event, resolve);
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
