import firebase from '@firebase/app';
import {User, UserInfo} from '@firebase/auth-types';

import {AlbumList} from './album_list';
import * as apikeys from './apikeys';
import {LightBox} from './light_box';
import {photos} from './photos_api';
import * as schema from './schema';
import {UserCard} from './user_card';

const kNoPhotoUrl = 'images/icons/icon-128x128.png';
const kAlbumPageSize = 50;
const kApiEndpoint = 'https://photoslibrary.googleapis.com';

const statusPara = <HTMLParagraphElement>document.querySelector('p.status');

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

let gapiReady = false;
let onGapiReady: null|(() => void) = null;

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
    this.providerData = authUser.providerData;

    this.authUser = authUser;
    if (this.uid != authUser.uid) {
      this.uid = authUser.uid;
      this.tryLoad();
    }
    this.initApi();
  }

  public albumChecked(album: photos.Album, checked: boolean) {
    if (checked)
      LightBox.setAlbum(album);
  }

  async tryLoad() {
    const data = await schema.getForUid(this.uid);
    if (this.gapiUser == null) {
      console.log('Using ' + data.albums.length + ' from db.');
      this.albums = data.albums;
      AlbumList.create();
    } else {
      console.log('gapi beat indexdb.');
    }
  }

  async tryEarlyLoad() {
    if (this.uid != 0)
      return;

    const data = await schema.getGlobal();
    this.uid = data.lastUid;
    this.tryLoad();
  }

  async save() {
    await schema.setForUid(this.uid, {albums : this.albums});
    console.log('Saved ' + this.albums.length + ' albums.');
    await schema.setGlobal({lastUid : this.uid});
  }

  async initApi() {
    if (!gapiReady) {
      onGapiReady = this.initApi.bind(this);
      return;
    }
    await gapi.client.init({
      apiKey : apikeys.kFirebase,
      clientId : apikeys.kPhotos.web.client_id,
      discoveryDocs : [],
      scope : apikeys.kScopes.join(' ')
    });

    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      this.updateAlbums();
    }
    document.querySelector('#load-api')!.addEventListener(
        'click', this.signIn.bind(this));
  }

  async signIn() {
    if (!firebase.auth)
      return;

    statusPara.innerText = 'Linking to Photos API…';
    const googleAuth = gapi.auth2.getAuthInstance()
    const googleUser = await googleAuth.signIn();
    const idToken = googleUser.getAuthResponse().id_token;
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    await firebase.auth().signInAndRetrieveDataWithCredential(credential);

    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      statusPara.innerText = 'Failed to link photos API.';
      // firebase.auth!().signOut(); // Something went wrong, sign out
      return;
    }

    this.updateAlbums();
  }

  async updateAlbums() {
    statusPara.innerText = 'Updating albums via gapi…';
    this.gapiUser = gapi.auth2.getAuthInstance().currentUser.get();
    this.albums = [];

    let error = null;

    try {
      const authToken = this.gapiUser.getAuthResponse().access_token;
      let nextPageToken = null;
      do {
        let url = kApiEndpoint + '/v1/albums?pageSize=' + kAlbumPageSize;
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
        if (nextPageToken)
          statusPara.innerText = `${this.albums.length} albums. Fetching more…`;
      } while (nextPageToken != null);
      this.save();
    } catch (err) {
      error = logError(err);
    }

    const errorText = error ? ` (${error.message})` : '';
    statusPara.innerText =
        `${this.albums.length} Albums loaded over gapi${errorText}. Ready.`;
    return [ this.albums, error ];
  }
}

function gapiPreload() {
  const gapiScript = document.createElement('script');
  gapiScript.onload = () => {
    (<any>gapi).load('client', () => {
      gapiReady = true;
      if (onGapiReady) {
        onGapiReady();
        onGapiReady = null;
      }
    });
  };
  document.body.appendChild(gapiScript);
  gapiScript.src = 'https://apis.google.com/js/api.js';
}

document.addEventListener('serviceworker-ready', gapiPreload);
document.addEventListener('serviceworker-ready',
                          () => { MPUser.current.tryEarlyLoad(); });

document.addEventListener('firebase-ready', (event) => {
  if (!firebase.auth)
    return;

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in.
      statusPara.innerText = 'Logged in via Firebase. Checking gapi.';
      MPUser.current.apply(user);
    } else {
      // User is signed out.
      statusPara.innerText = 'Not logged in. Placeholder user.';
      MPUser.current = new MPUser();
    }
    UserCard.update();
  });
});
