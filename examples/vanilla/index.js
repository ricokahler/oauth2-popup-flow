/** @type {HTMLElement} */
const content = document.querySelector('.content');

const auth = new OAuth2PopupFlow.OAuth2PopupFlow({
  authorizationUri: 'https://formandfocus.auth0.com/authorize',
  clientId: 'v90UOqUtmib6bTNIm3zHuYboekqoAXwN',
  redirectUri: 'http://localhost:8080/redirect',
  scope: 'openid profile',
  responseType: 'id_token',
  accessTokenResponseKey: 'id_token',
  additionalAuthorizationParameters: {
    nonce: Math.random().toString(),
  }
});

async function main() {
  content.innerHTML = '';
  if (auth.loggedIn()) {
    const payload = await auth.tokenPayload();
    content.innerText = `Welcome, ${payload.name}!`;
    const logoutButton = document.createElement('button');
    logoutButton.innerText = 'Logout';
    logoutButton.addEventListener('click', () => {
      auth.logout();
      main();
    });
    content.appendChild(logoutButton);
  } else {
    const loginButton = document.createElement('button');
    loginButton.innerText = 'Login';
    loginButton.addEventListener('click', async () => {
      await auth.tryLoginPopup();
      main();
    });
    content.appendChild(loginButton);
  }
}

main();