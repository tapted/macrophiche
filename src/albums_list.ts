import {MPUser} from './model';

export class AlbumList extends HTMLUListElement {
  constructor() {
    super();
  }
  _update(model: MPUser) {
    model.albums.forEach((album) => {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      
    });
  }
  static update() {
    let list = <AlbumList>document.querySelector('album-list');
    if (!list)
      return;
    list._update(MPUser.current);
  }
}

window.customElements.define('album-list', AlbumList);
