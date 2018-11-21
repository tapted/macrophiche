// import * as functions from 'firebase-functions';
import firebase from '@firebase/app';

document.addEventListener('DOMContentLoaded', () => {
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
  var config = {
    apiKey : apikeys.firebase,
    authDomain: "macrophiche.firebaseapp.com",
    databaseURL: "https://macrophiche.firebaseio.com",
    projectId: "macrophiche",
    storageBucket: "macrophiche.appspot.com",
    messagingSenderId: "883029956059"
  };
  firebase.initializeApp(config);

  try {
    let app = firebase.app();
    let features = [ 'auth', 'database', 'messaging', 'storage' ].filter(
        feature => typeof app[feature] === 'function');
    document.getElementById('load').innerHTML =
        `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load').innerHTML =
        'Error loading the Firebase SDK, check the console.';
  }
});
