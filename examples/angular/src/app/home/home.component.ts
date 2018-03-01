import { Component, OnInit } from '@angular/core';
import { OAuth2PopupFlow } from 'oauth2-popup-flow';
import { TokenPayload } from '../auth.config';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  name = '';

  constructor(
    public auth: OAuth2PopupFlow<TokenPayload>,
  ) { }

  async ngOnInit() {
    const payload = await this.auth.tokenPayload();
    this.name = payload.name;
  }

  onLogoutClick() {
    this.auth.logout();
  }
}
