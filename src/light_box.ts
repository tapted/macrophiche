import {photos} from './photos_api';

const statusPara = <HTMLParagraphElement>document.querySelector('p.status');
const screenWidth = screen.width;
const screenHeight = screen.height;

export class LightBox extends HTMLElement {
  private lastWidth: number = 0;
  private img: HTMLImageElement;

  constructor() {
    super();
    this.style.display = 'flex';
    this.style.width = '100%';
    this.style.paddingTop = '56.25%' this.style.background = 'white';
    this.style.marginTop = '8px';
    this.style.borderRadius = '3px';
    this.img = document.createElement('img');
    this.img.style.width = '100%';
    this.img.style.height = '100%';
  }
  private _update(album: photos.Album) {
    const width = this.clientWidth;
    statusPara.innerText =
        `TODO: Load album: ${album.id} into lbw=${width} w=${screenWidth}`;
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
