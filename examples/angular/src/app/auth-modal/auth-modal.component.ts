import { Component, OnInit } from '@angular/core';
import { OAuth2PopupFlow } from 'oauth2-popup-flow';
import { TokenPayload } from '../auth.config';

@Component({
  selector: 'auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit {

  constructor(
    public auth: OAuth2PopupFlow<TokenPayload>,
  ) { }

  async ngOnInit() {
  }

  async onRetryClick() {
    await this.auth.tryLoginPopup();
  }

}
