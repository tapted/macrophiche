import {MPUser} from './model';
import {photos} from './photos_api';

const kAlbumTemplate = document.createElement('template');
kAlbumTemplate.innerHTML = `<li>
<label><input type="checkbox"></input><span></span></label>
<a target="_blank">🔗</a> (<span></span> items)</li>`;

class ShadowElement extends HTMLElement {
  constructor(template: HTMLTemplateElement) {
    super();
    this.attachShadow({mode : 'open'});
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  qA(): HTMLAnchorElement {
    return this.shadowRoot!.querySelector('a')!;
  }
  qSpan() : HTMLSpanElement {
    return this.shadowRoot!.querySelector('span')!;
  }
  qSpanX(index: number) : HTMLSpanElement {
    return this.shadowRoot!.querySelectorAll('span')[index]!;
  }
}

class MPAlbum extends ShadowElement {
  constructor() {
    super(kAlbumTemplate);
  }

  static create(data: photos.Album): MPAlbum {
    const album = <MPAlbum>document.createElement('mp-album');
    album.update(data);
    return album;
  }

  public update(data: photos.Album) {
    this.qSpanX(0).innerText = data.title;
    this.qA().href = data.productUrl;
    this.qSpanX(1).innerText = data.mediaItemsCount;
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
