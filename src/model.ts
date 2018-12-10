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

export function logError(err: any) {
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

  refreshButton: HTMLButtonElement;

  constructor() {
    this.refreshButton =
        <HTMLButtonElement>document.querySelector('button.refresh-albums');
    this.refreshButton.addEventListener('click', this.updateAlbums.bind(this));
  }

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

    document.querySelector('#load-api')!.addEventListener(
        'click', this.signIn.bind(this));
    this.refresh(true);
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

    this.refresh();
  }

  refresh(first = false) {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      statusPara.innerText = 'Not linked to photos API.';
      this.refreshButton.disabled = true;
      return;
    }
    if (first)
      statusPara.innerText = 'gapi ready. Using cached data.';
    this.refreshButton.disabled = false;
    this.gapiUser = gapi.auth2.getAuthInstance().currentUser.get();
    if (this.albums.length == 0)
      this.updateAlbums();
  }

  public async gapiFetch(url: string, post: object|null = null) {
    if (!this.gapiUser)
      throw new Error('Missing GAPI user for fetch.');
    const authToken = this.gapiUser.getAuthResponse().access_token;
    const options: RequestInit = {};
    options.headers = {Authorization : `Bearer ${authToken}`};
    if (post) {
      options.headers['Content-Type'] = 'application/json; charset=utf-8';
      options.method = 'POST';
      options.body = JSON.stringify(post);
    }
    const response = await fetch(kApiEndpoint + url, options);
    return response.json();
  }

  public async imgFetch(key: string, baseUrl: string, width: number,
                        height: number, crop = false) {
    const url = baseUrl + `=w${width}-h${height}${crop ? '-c' : ''}`;
    const img = new Image();
    img.src = '/imgproxy/' + key + '/?url=' + encodeURIComponent(url);
    try {
      await img.decode();
    } catch (e) {
      img.src = img.src + '&force=1';
      try {
        await img.decode();
      } catch (e) {
        return '/images/stale.png';
      }
    }
    return url;
  }

  async updateAlbums() {
    this.refreshButton.disabled = true;
    statusPara.innerText = 'Updating albums via gapi…';
    this.albums = [];

    let error = null;

    try {
      let nextPageToken = null;
      do {
        let url = '/v1/albums?pageSize=' + kAlbumPageSize;
        if (nextPageToken)
          url += '&pageToken=' + nextPageToken;
        const result = await this.gapiFetch(url);
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
    this.refreshButton.disabled = false;

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
