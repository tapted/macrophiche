import {MPUser} from './model';
import {photos} from './photos_api';

class MPAlbum extends HTMLLIElement {
  constructor() { super(); }

  static create(data: photos.Album): MPAlbum {
    const album = <MPAlbum>document.createElement('li', {is : 'mp-album'});
    album.update(data);
    return album;
  }

  public update(data: photos.Album) {
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.name = data.id;
    const labelText = document.createElement('span');
    labelText.innerText = data.title;
    const label = document.createElement('label');
    label.appendChild(check);
    label.appendChild(labelText);
    const link = document.createElement('a');
    link.innerText = '🔗';
    link.href = data.productUrl;
    link.target = '_blank';
    const summary = document.createElement('span');
    summary.innerText = ` (${data.mediaItemsCount})`;
    [label, link, summary].forEach((child) => { this.appendChild(child); });
  }
}

window.customElements.define('mp-album', MPAlbum, {extends : 'li'});

export class AlbumList extends HTMLUListElement {
  private albums = new Map<string, MPAlbum>();

  constructor() { super(); }
  _update(model: MPUser) {
    // TOOD: Removal logic.
    model.albums.forEach((data) => {
      let album = this.albums.get(data.id);
      if (album) {
        // TODO: Update logic.
        return;
      }
      album = MPAlbum.create(data);
      this.albums.set(data.id, album);
      this.appendChild(album);
    });
  }
  static update() {
    let list = <AlbumList>document.querySelector('#album-list');
    if (!list) {
      console.error('Missing <album-list>');
      return;
    }
    list._update(MPUser.current);
  }
}

window.customElements.define('album-list', AlbumList, {extends : 'ul'});
