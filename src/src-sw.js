workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

const thumbRegex = new RegExp('=w[0-9]*-h[0-9]*-c$');
const matchThumb = ({url, event}) => {
  if (!url.hostname.endswith('googleusercontent.com'))
    return false;
  return thumbRegex.test(url.pathname);
};

workbox.routing.registerRoute(
  matchThumb,
  workbox.strategies.staleWhileRevalidate(),
);
