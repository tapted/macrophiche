import {photos} from './photos_api';

const statusPara = <HTMLParagraphElement>document.querySelector('p.status');

export class LightBox extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'flex';
  }
  private _update(album: photos.Album) {
    statusPara.innerText = 'TODO: Load album: ' + album.id;
  }
  static setAlbum(album: photos.Album) {
    let lb = <LightBox>document.querySelector('light-box');
    if (!lb) {
      console.error('Missing <light-box>');
      return;
    }
    lb._update(album);
  }
}

window.customElements.define('light-box', LightBox);
