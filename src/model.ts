import firebase from '@firebase/app';

import {User, UserInfo} from '@firebase/auth-types';

import {UserCard} from './user_card';

// Macrophiche user.
export class MPUser {
  static current = new MPUser();

  public displayName: string = 'Not logged in';
  public email: string = '';
  public emailVerified: boolean = false;
  public photoUrl: string = '';
  public isAnonymous: boolean = true;
  public uid: any = 0;
  public providerData: (UserInfo|null)[] = [];

  constructor() {}

  apply(authUser: User) {
    this.displayName = authUser.displayName || 'Name Unknown';
    this.email = authUser.email || 'Email Unknown';
    this.emailVerified = authUser.emailVerified;
    this.photoUrl = authUser.photoURL || 'images/nophoto.png';
    this.isAnonymous = authUser.isAnonymous;
    this.uid = authUser.uid;
    this.providerData = authUser.providerData;
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
