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
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            finishLoad();
            console.log('SW registered: ', registration);
            return;
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
    });
  } else {
    console.log('serviceWorker not available.');
  }
  finishLoad();
});
