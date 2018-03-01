import { Component, OnInit } from '@angular/core';
import { OAuth2PopupFlow } from 'oauth2-popup-flow';
import { TokenPayload } from '../auth.config';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.css']
})
export class RedirectComponent implements OnInit {

  constructor(
    public auth: OAuth2PopupFlow<TokenPayload>,
  ) { }

  ngOnInit() {
    this.auth.handleRedirect();
    window.close();
  }
}
