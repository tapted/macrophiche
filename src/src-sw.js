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
