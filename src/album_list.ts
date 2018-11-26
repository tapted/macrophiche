import {MPUser} from './model';
import {photos} from './photos_api';

const kAlbumTemplate = document.createElement('template');
kAlbumTemplate.innerHTML = `<li>
<label><input type="checkbox"></input><span></span></label>
<a target="_blank">🔗</a> (<span></span> items)</li>`;

class MPAlbum extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode : 'open'});
    this.shadowRoot!.appendChild(kAlbumTemplate.content.cloneNode(true));
  }

  static create(data: photos.Album): MPAlbum {
    const album = <MPAlbum>document.createElement('mp-album');
    album.update(data);
    return album;
  }

  public update(data: photos.Album) {
    this.shadowRoot!.querySelectorAll('span')[0]!.innerText = data.title;
    this.shadowRoot!.querySelector('a')!.href = data.productUrl;
    this.shadowRoot!.querySelectorAll('span')[1]!.innerText =
        data.mediaItemsCount;
  }
}

window.customElements.define('mp-album', MPAlbum);

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
