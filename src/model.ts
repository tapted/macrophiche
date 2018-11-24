import firebase from '@firebase/app';

import {User, UserInfo} from '@firebase/auth-types';

import {UserCard} from './user_card';

import * as apikeys from './apikeys';

const kNoPhotoUrl = 'images/icons/icon-128x128.png';
const kAlbumPageSize = 50;
const kApiEndpoint = 'https://photoslibrary.googleapis.com';

function logError(err: any) {
  if (err.error.code) {
    console.log(err.error);
    return err.error;
  }
  let error = err.error.error ||
      {name: err.name, code: err.statusCode, message: err.message};
  console.log(error);
  return error;
}

// Macrophiche user.
export class MPUser {
  static current = new MPUser();

  public displayName: string = 'Not logged in';
  public email: string = '';
  public emailVerified: boolean = false;
  public photoUrl: string = kNoPhotoUrl;
  public isAnonymous: boolean = true;
  public uid: any = 0;
  public providerData: (UserInfo|null)[] = [];

  public authUser: (User|null) = null;
  public gapiUser: (gapi.auth2.GoogleUser|null) = null;
  public oauthToken: (string|null) = null;

  private albums: object[] = [];

  constructor() {}

  apply(authUser: User) {
    this.displayName = authUser.displayName || 'Name Unknown';
    this.email = authUser.email || 'Email Unknown';
    this.emailVerified = authUser.emailVerified;
    this.photoUrl = authUser.photoURL || kNoPhotoUrl;
    this.isAnonymous = authUser.isAnonymous;
    this.uid = authUser.uid;
    this.providerData = authUser.providerData;

    this.authUser = authUser;
    // this.loadApi();
    this.updateAlbums();
  }

  async loadApi() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = (event) => {
      (<any>gapi).load('client', () => { this.initApi(); });
    };
    script.src = 'https://apis.google.com/js/api.js';
    document.body.appendChild(script);  
  }

  // Initialize the Google API Client with the config object
  async initApi() {
    console.log('Initializing Google API Client');
     await gapi.client.init({
       apiKey: apikeys.kPhotos.web.client_secret,
       clientId: apikeys.kPhotos.web.client_id,
       discoveryDocs: [],
//       discoveryDocs: config.discoveryDocs,
       scope: apikeys.kScopes.join(' ')
     });
    // Make sure the Google API Client is properly signed in
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      console.log('Not signed in I guess');
      //firebase.auth!().signOut(); // Something went wrong, sign out
      return;
    }

    this.gapiUser = gapi.auth2.getAuthInstance().currentUser.get();
    this.oauthToken = this.gapiUser.getAuthResponse().access_token;
    this.updateAlbums();
  }

  async updateAlbums() {
    console.log('Updating albums..');
    this.albums = [];

    if (!this.authUser)
      return;

    let error = null;
  
    try {
      const authToken = await this.authUser.getToken();

      let nextPageToken = null;
      do {
        console.log(`Loading albums. Received so far: ${this.albums.length}`);

        let url = kApiEndpoint + '/v1/albums?pageSize=50';
        if (nextPageToken)
          url += '&pageToken=' + nextPageToken;
        console.log(authToken);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }});
        const result = await response.json();
        if (!result)   
          break;

        if (result.error)
          logError(result);

        if (result.albums) {
          console.log(`Number of albums received: ${result.albums.length}`);
          const items = result.albums.filter((x:object) => !!x);
          this.albums = this.albums.concat(items);
        }
        nextPageToken = result.nextPageToken;
      } while (nextPageToken != null);

    } catch (err) {
      error = logError(err);
    }

    console.log('Albums loaded.');
    console.log(this.albums);
    return [this.albums, error];
  }
}

document.addEventListener('firebase-ready', (event) => {
  if (!firebase.auth)
    return;

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in.
      MPUser.current.apply(user);
    } else {
      // User is signed out.
      MPUser.current = new MPUser();
    }
    UserCard.update();
  });
});
