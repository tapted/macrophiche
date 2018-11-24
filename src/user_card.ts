import {MPUser} from './model';

export class UserCard extends HTMLElement {
  private img: HTMLImageElement;
  private p: HTMLParagraphElement;

  constructor() {
    super();
    this.img = document.createElement('img');
    this.img.width = 128;
    this.img.height = 128;
    this.appendChild(this.img);

    this.p = document.createElement('p');
    this.appendChild(this.p);
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
