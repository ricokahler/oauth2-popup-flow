import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { OAuth2PopupFlow } from 'oauth2-popup-flow';
import { auth } from './auth.config';

import { AppComponent } from './app.component';
import { AuthModalComponent } from './auth-modal/auth-modal.component';
import { RedirectComponent } from './redirect/redirect.component';
import { AppRoutingModule } from './/app-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthModalComponent,
    RedirectComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [{ provide: OAuth2PopupFlow, useValue: auth }],
  bootstrap: [AppComponent]
})
export class AppModule { }
