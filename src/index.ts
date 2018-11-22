import {initfire} from './initfire';

document.addEventListener('DOMContentLoaded', initfire);
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/js/sw.js')
          .then(
              registration => { console.log('SW registered: ', registration); })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
    });
  } else {
    console.log('serviceWorker not available.');
  }
});