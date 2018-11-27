import {MPUser} from './model';
import {photos} from './photos_api';

const kImgSize = 200;
const kPad = 10;
const kOutline = 5;
const kRadius = 5;
const kAlbumTemplate = document.createElement('template');
kAlbumTemplate.innerHTML = `
<style>
li {
  clip-path: inset(0px ${kPad}px ${kPad}px 0px round ${kRadius}px);
  background-color: lightgray;
}
label {
  width: ${kImgSize}px;
  height: ${kImgSize}px;
  display: inline-block;
  padding: ${kPad}px;
  clip-path: inset(${kOutline}px ${kPad * 2}px ${kPad * 2}px ${kOutline}px round ${kRadius}px);
  color: white;
  text-shadow: 2px 2px black;
  background-repeat: no-repeat;
  background-position: ${kOutline}px ${kOutline}px;
}
label:hover {
  color: black;
  text-shadow: 2px 2px white;
}
input {
  opacity: 0;
  position: absolute;
}
</style>
<li>
<label><input type="checkbox"></input>
<span></span>
<a target="_blank">🔗</a> (<span></span> items)</li></label>`;

class ShadowElement extends HTMLElement {
  constructor(template: HTMLTemplateElement) {
    super();
    this.attachShadow({mode : 'open'});
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  qA(): HTMLAnchorElement {
    return this.shadowRoot!.querySelector('a')!;
  }
  qLI(): HTMLLIElement {
    return this.shadowRoot!.querySelector('li')!;
  }
  qLabel(): HTMLLabelElement {
    return this.shadowRoot!.querySelector('label')!;
  }
  qInput(): HTMLInputElement {
    return this.shadowRoot!.querySelector('input')!;    
  }
  qImg(): HTMLImageElement {
    return this.shadowRoot!.querySelector('img')!;
  }
  qSpan() : HTMLSpanElement {
    return this.shadowRoot!.querySelector('span')!;
  }
  qSpanX(index: number) : HTMLSpanElement {
    return this.shadowRoot!.querySelectorAll('span')[index]!;
  }
}

class MPAlbum extends ShadowElement {
  private li: HTMLLIElement;
  private check: HTMLInputElement;

  constructor() {
    super(kAlbumTemplate);
    this.li = this.qLI();
    this.check = this.qInput();
    this.check.addEventListener('input', () => {
      this.li.style.backgroundColor = this.check.checked ? 'blue' : 'lightgray';   
    });
  }

  static create(data: photos.Album, authToken: string): MPAlbum {
    const album = <MPAlbum>document.createElement('mp-album');
    album.update(data, authToken);
    return album;
  }

  public async update(data: photos.Album, authToken: string) {
    this.qSpanX(0).innerText = data.title;
    this.qA().href = data.productUrl;
    this.qSpanX(1).innerText = data.mediaItemsCount;
    const url = 'url(' + data.coverPhotoBaseUrl + `=w${kImgSize}-h${kImgSize}-c)`;
    this.qLabel().style.backgroundImage = url;
    // const response = await fetch(
    //         url, {mode: 'no-cors',
    //         headers : {Authorization : `Bearer ${authToken}`}});
    // const blob = await response.blob();
    // img.src = URL.createObjectURL(blob);
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
  }
  _update(model: MPUser, authToken:string) {
    // TOOD: Removal logic.
    model.albums.forEach((data) => {
      let album = this.albums.get(data.id);
      if (album) {
        // TODO: Update logic.
        return;
      }
      album = MPAlbum.create(data, authToken);
      this.albums.set(data.id, album);
      this.appendChild(album);
    });
  }
  static update(authToken: string) {
    let list = <AlbumList>document.querySelector('#album-list');
    if (!list) {
      console.error('Missing <album-list>');
      return;
    }
    list._update(MPUser.current, authToken);
  }
}

window.customElements.define('album-list', AlbumList, {extends : 'ul'});
