// Import model for side-effects (adding event listeners).
import './model';

import {initfire} from './initfire';

function finishLoad() {
  const event = new CustomEvent('serviceworker-ready');
  document.dispatchEvent(event);

  const webfont = document.createElement('script');
  webfont.onload = () => {
    (<any>window).WebFont.load({google : {families : [ 'Roboto' ]}});
  };
  document.body.appendChild(webfont);
  webfont.src =
      'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
}

document.addEventListener('DOMContentLoaded', initfire);

function showRefreshUI(registration: ServiceWorkerRegistration) {
  var button = document.createElement('button');
  button.style.position = 'absolute';
  button.style.bottom = '24px';
  button.style.left = '24px';
  button.textContent = 'This site has updated. Please click to see changes.';

  button.addEventListener('click', () => {
    if (!registration.waiting)
      return; // Can't postMessage yet.

    button.disabled = true;
    registration.waiting.postMessage('skipWaiting');
  });

  document.body.appendChild(button);
};

function onNewServiceWorker(registration: ServiceWorkerRegistration,
                            callback: () => void) {
  if (registration.waiting)
    return callback();

  function listenInstalledStateChange() {
    registration.installing!.addEventListener('statechange', (event: any) => {
      // A new service worker is available.
      if (event.target.state === 'installed')
        callback();
    });
  };

  if (registration.installing)
    return listenInstalledStateChange();

  // Add a listener in case a new SW is found,
  registration.addEventListener('updatefound', listenInstalledStateChange);
}

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        let registration = await navigator.serviceWorker.register('/sw.js');
        finishLoad();

        // Track updates to the Service Worker.
        if (!navigator.serviceWorker.controller)
          return; // New service worker (no other clients).

        // When the user asks to refresh the UI, we'll need to reload the window
        let preventDevToolsReloadLoop = false;
        navigator.serviceWorker.addEventListener(
            'controllerchange', (event) => {
              if (preventDevToolsReloadLoop)
                return;
              preventDevToolsReloadLoop = true;
              console.log('Controller loaded');
              window.location.reload();
            });

        onNewServiceWorker(registration,
                           () => { showRefreshUI(registration); });

        console.log('SW registered: ', registration);
      } catch (registrationError) {
        finishLoad();
        console.log('SW registration failed: ', registrationError);
      }
    });
  } else {
    console.log('serviceWorker not available.');
    finishLoad();
  }
});
