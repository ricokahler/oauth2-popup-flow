import { OAuth2PopupFlow } from 'oauth2-popup-flow';

export interface TokenPayload {
  given_name: string,
  family_name: string,
  nickname: string,
  name: string,
  picture: string,
  gender: string,
  locale: string,
  updated_at: string,
  iss: string,
  sub: string,
  aud: string,
  iat: number,
  exp: number,
  nonce: string,
}

function time(milliseconds: number) {
  return new Promise<'TIMER'>(resolve => setTimeout(() => resolve('TIMER'), milliseconds));
}

export const auth = new OAuth2PopupFlow<TokenPayload>({
  // you would get this values from `environment.ts` in real use.
  authorizationUrl: 'https://formandfocus.auth0.com/authorize',
  clientId: 'v90UOqUtmib6bTNIm3zHuYboekqoAXwN',
  redirectUri: 'http://localhost:4200/redirect',
  scope: 'openid profile',
  responseType: 'id_token',
  accessTokenResponseKey: 'id_token',
  additionalAuthorizationParameters: {
    nonce: Math.random().toString(),
  },
  beforePopup: () => time(1000),
});
