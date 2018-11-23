import '@firebase/auth';
// import '@firebase/database';
// import '@firebase/messaging';
// import '@firebase/storage';

import firebase from '@firebase/app';

import * as apikeys from './apikeys';

export function initfire() {
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  // // The Firebase SDK is initialized and available here!
  //
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  //
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  // Initialize Firebase
  let config = {
    apiKey : apikeys.kFirebase,
    authDomain : "macrophiche.firebaseapp.com",
    databaseURL : "https://macrophiche.firebaseio.com",
    projectId : "macrophiche",
    storageBucket : "macrophiche.appspot.com",
    messagingSenderId : "883029956059"
  };
  firebase.initializeApp(config);

  try {
    let app = <any>firebase.app();
    let features = [
      [ 'Auth', app.auth ], [ 'Database', app.database ],
      [ 'Messaging', app.messaging ], [ 'Storage', app.storage ]
    ].map((func) => {
      // console.log(func);
      return func[1] && func[0];
    });
    document.getElementById('load')!.innerHTML =
        `Firebase SDK loaded with ${features.join(', ')}`;
    const event =
        new CustomEvent('firebase-ready', {detail : {firebase : firebase}});
    document.dispatchEvent(event);
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML =
        'Error loading the Firebase SDK, check the console.';
  }
}
