import {logError, MPUser} from './model';
import {photos} from './photos_api';

const kAlbumPageSize = 100;

const statusPara = <HTMLParagraphElement>document.querySelector('p.status');
const screenWidth = screen.width;
const screenHeight = screen.height;

export class LightBox extends HTMLElement {
  private lastWidth: number = 0;
  private img: HTMLImageElement;

  public items: photos.MediaItem[] = [];

  constructor() {
    super();
    this.style.display = 'flex';
    this.style.width = '100%';
    this.style.paddingTop = '56.25%';
    this.style.background = 'white';
    this.style.marginTop = '8px';
    this.style.borderRadius = '3px';
    this.style.position = 'relative';
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.width = '0';
    this.img = document.createElement('img');
    container.appendChild(this.img);
    this.appendChild(container);
  }
  private async _update(album: photos.Album) {
    this.items = [];
    statusPara.innerText = `TODO: Load album: ${album.id} into lbw=${
        this.clientWidth} w=${screenWidth}`;

    let error = null;
    try {
      let nextPageToken = null;
      do {
        let url = '/v1/mediaItems:search';
        let post = <any>{pageSize : kAlbumPageSize, albumId : album.id};
        if (nextPageToken)
          post.pageToken = nextPageToken;
        const result = await MPUser.current.gapiFetch(url, post);
        if (!result)
          break;

        if (result.error)
          logError(result);

        if (result.mediaItems) {
          const items = result.mediaItems.filter((x: object) => !!x);
          this.items = this.items.concat(items);
          this.img.src = await MPUser.current.imgFetch(
              'item/' + this.items[0].id, this.items[0].baseUrl, screenWidth,
              screenHeight);
          break;
        }
        nextPageToken = result.nextPageToken;
        if (nextPageToken)
          statusPara.innerText = `${this.items.length} items. Fetching more…`;
      } while (nextPageToken != null);
    } catch (err) {
      error = logError(err);
    }
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
