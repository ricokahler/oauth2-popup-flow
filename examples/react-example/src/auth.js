import { OAuth2PopupFlow } from 'oauth2-popup-flow';

export default new OAuth2PopupFlow({
  authorizationUri: 'https://formandfocus.auth0.com/authorize',
  clientId: 'v90UOqUtmib6bTNIm3zHuYboekqoAXwN',
  redirectUri: 'http://localhost:8080/redirect',
  scope: 'openid profile',
  responseType: 'id_token',
  accessTokenResponseKey: 'id_token',
  additionalAuthorizationParameters: {
    nonce: Math.random().toString(),
  },
});
