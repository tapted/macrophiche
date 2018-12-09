import {MPUser} from './model';
import {photos} from './photos_api';

const kImgSize = 150;
const kPad = 8;     // Padding between albums.
const kOutline = 5; // Thicknes of the selection outline.
const kRadius = 5;  // Rectangle corner radius.
const kMargin = 15; // Margin around text inside each album.
const kLimit = 2;  // Album limit.
const kAlbumTemplate = document.createElement('template');
kAlbumTemplate.innerHTML = `
<style>
li {
  clip-path: inset(0 round ${kRadius}px);
  background-color: lightgray;
  padding: ${kOutline}px;
  margin: 0 ${kPad}px ${kPad}px 0;
}
label {
  width: ${kImgSize}px;
  height: ${kImgSize}px;
  display: inline-block;
  clip-path: inset(0 round ${kRadius}px);
  color: white;
  text-shadow: 1px 1px black;
  background-repeat: no-repeat;
}
p {
  margin: 0;
  padding: ${kMargin}px;
}
label:hover {
  color: black;
  text-shadow: 1px 1px white;
}
input {
  opacity: 0;
  position: absolute;
}
</style>
<li>
<label><input type="checkbox"></input>
<p>
<span></span>
<a target="_blank">🔗</a> (<span></span> items)</p></li></label>`;

class ShadowElement extends HTMLElement {
  constructor(template: HTMLTemplateElement) {
    super();
    this.attachShadow({mode : 'open'});
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  qA(): HTMLAnchorElement { return this.shadowRoot!.querySelector('a')!; }
  qLI(): HTMLLIElement { return this.shadowRoot!.querySelector('li')!; }
  qLabel(): HTMLLabelElement {
    return this.shadowRoot!.querySelector('label')!;
  }
  qInput(): HTMLInputElement {
    return this.shadowRoot!.querySelector('input')!;
  }
  qImg(): HTMLImageElement { return this.shadowRoot!.querySelector('img')!; }
  qSpan(): HTMLSpanElement { return this.shadowRoot!.querySelector('span')!; }
  qSpanX(index: number): HTMLSpanElement {
    return this.shadowRoot!.querySelectorAll('span')[index];
  }
}

class MPAlbum extends ShadowElement {
  private li: HTMLLIElement;
  private check: HTMLInputElement;
  private album: photos.Album|null = null;

  constructor() {
    super(kAlbumTemplate);
    this.li = this.qLI();
    this.check = this.qInput();
    this.check.addEventListener('input', () => {
      this.li.style.backgroundColor = this.check.checked ? 'blue' : 'lightgray';
      if (this.album)
        MPUser.current.albumChecked(this.album, this.check.checked);
    });
  }

  static create(data: photos.Album): MPAlbum {
    const album = <MPAlbum>document.createElement('mp-album');
    album.update(data);
    return album;
  }

  public async update(data: photos.Album) {
    this.album = data;
    this.qSpanX(0).innerText = data.title;
    this.qA().href = data.productUrl;
    this.qSpanX(1).innerText = data.mediaItemsCount;
    const url = data.coverPhotoBaseUrl + `=w${kImgSize}-h${kImgSize}-c`;
    const img = new Image();
    img.src = '/imgproxy/albumcover/' + data.id + '/?url=' + encodeURIComponent(url);
    await img.decode();
    this.qLabel().style.backgroundImage = `url(${url})`;
  }
}

window.customElements.define('mp-album', MPAlbum);

export class AlbumList extends HTMLUListElement {
  private albums = new Map<string, MPAlbum>();

  constructor() {
    super();
    this.style.display = 'flex';
    this.style.flexWrap = 'wrap';
    this.style.listStyleType = 'none';
    this.style.padding = `${kPad}px`;
    this.style.userSelect = 'none';
  }
  _update(model: MPUser) {
    // TODO: Removal logic.
    let count = 0;
    model.albums.forEach((data) => {
      if (++count > kLimit)
        return;

      let album = this.albums.get(data.id);
      if (album) {
        album.update(data);
        return;
      }
      album = MPAlbum.create(data);
      this.albums.set(data.id, album);
      this.appendChild(album);
    });
    // TODO: Reorder children.
  }
  static create() { AlbumList.update(); }
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
