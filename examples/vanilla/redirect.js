const auth = new OAuth2WindowDotOpen.OAuth2WindowDotOpen({
  authorizationUrl: 'https://formandfocus.auth0.com/authorize',
  clientId: 'v90UOqUtmib6bTNIm3zHuYboekqoAXwN',
  redirectUri: 'http://localhost:8080/redirect',
  scope: 'openid profile',
  responseType: 'id_token',
  accessTokenResponseKey: 'id_token',
});

auth.handleRedirect();