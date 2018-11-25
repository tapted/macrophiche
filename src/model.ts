import firebase from '@firebase/app';
import {User, UserInfo} from '@firebase/auth-types';

import {AlbumList} from './album_list';
import * as apikeys from './apikeys';
import {photos} from './photos_api';
import {UserCard} from './user_card';

const kNoPhotoUrl = 'images/icons/icon-128x128.png';
const kAlbumPageSize = 50;
const kApiEndpoint = 'https://photoslibrary.googleapis.com';

function logError(err: any) {
  if (err.error && err.error.code) {
    console.log(err.error);
    return err.error;
  }
  if (err.error && err.error.error) {
    console.log(err.error.error);
    return err.error.error;
  }
  let error = {name : err.name, code : err.statusCode, message : err.message};
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

  public albums: photos.Album[] = [];

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
    (<any>gapi).load('client', () => { this.initApi(); });
  }

  async initApi() {
    await gapi.client.init({
      apiKey : apikeys.kFirebase,
      clientId : apikeys.kPhotos.web.client_id,
      discoveryDocs : [],
      scope : apikeys.kScopes.join(' ')
    });

    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      console.log('Already signed in.');
      this.updateAlbums();
    }
    document.querySelector('#load-api')!.addEventListener(
        'click', this.signIn.bind(this));
  }

  async signIn() {
    if (!firebase.auth)
      return;

    console.log('Signing in..')
    const googleAuth = gapi.auth2.getAuthInstance()
    const googleUser = await googleAuth.signIn();
    const idToken = googleUser.getAuthResponse().id_token;
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    await firebase.auth().signInAndRetrieveDataWithCredential(credential);

    // Make sure the Google API Client is properly signed in
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      console.log('Not signed in I guess');
      // firebase.auth!().signOut(); // Something went wrong, sign out
      return;
    }

    this.updateAlbums();
  }

  async updateAlbums() {
    console.log('Updating albums..');
    this.gapiUser = gapi.auth2.getAuthInstance().currentUser.get();
    this.albums = [];

    let error = null;

    try {
      const authToken = this.gapiUser.getAuthResponse().access_token;
      let nextPageToken = null;
      do {
        console.log(`Loading albums. Received so far: ${this.albums.length}`);

        let url = kApiEndpoint + '/v1/albums?pageSize=50';
        if (nextPageToken)
          url += '&pageToken=' + nextPageToken;
        const response = await fetch(
            url, {headers : {Authorization : `Bearer ${authToken}`}});
        const result = await response.json();
        if (!result)
          break;

        if (result.error)
          logError(result);

        if (result.albums) {
          const items = result.albums.filter((x: object) => !!x);
          this.albums = this.albums.concat(items);
          AlbumList.update();
        }
        nextPageToken = result.nextPageToken;
      } while (nextPageToken != null);

    } catch (err) {
      error = logError(err);
    }

    console.log(`${this.albums.length} Albums loaded.`);
    return [ this.albums, error ];
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
