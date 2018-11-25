import {MPUser} from './model';

export class UserCard extends HTMLElement {
  private img: HTMLImageElement;
  private p: HTMLSpanElement;

  constructor() {
    super();
    const kRadius = 32;

    this.style.display = 'flex';
    this.style.alignItems = 'center';

    this.img = document.createElement('img');
    this.img.width = kRadius * 2;
    this.img.height = kRadius * 2;
    this.img.style.clipPath = `circle(${kRadius}px at center)`;
    this.appendChild(this.img);

    this.p = document.createElement('span');
    this.appendChild(this.p);
    // this._update(MPUser.current);
  }
  _update(model: MPUser) {
    this.img.src = model.photoUrl;
    this.p.innerText = `${model.displayName} (${model.email})`;
  }
  static update() {
    let card = <UserCard>document.querySelector('user-card');
    if (!card)
      return;
    card._update(MPUser.current);
  }
}

window.customElements.define('user-card', UserCard);
