```
  ____               _   _     ___
 / __ \   /\        | | | |   |__ \
| |  | | /  \  _   _| |_| |__    ) |
| |  | |/ /\ \| | | | __| '_ \  / /
| |__| / ____ \ |_| | |_| | | |/ /_
 \____/_/    \_\__,_|\__|_| |_|____|

                           /$$$$$$$
                          | $$__  $$
                          | $$  \ $$ /$$$$$$   /$$$$$$  /$$   /$$  /$$$$$$
                          | $$$$$$$//$$__  $$ /$$__  $$| $$  | $$ /$$__  $$
                          | $$____/| $$  \ $$| $$  \ $$| $$  | $$| $$  \ $$
                          | $$     | $$  | $$| $$  | $$| $$  | $$| $$  | $$
                          | $$     |  $$$$$$/| $$$$$$$/|  $$$$$$/| $$$$$$$/
                          |__/      \______/ | $$____/  \______/ | $$____/
                                             | $$                | $$
                                             | $$                | $$      ______ _
                                             |__/                |__/     |  ____| |
                                                                          | |__  | | _____      __
                                                                          |  __| | |/ _ \ \ /\ / /
                                                                          | |    | | (_) \ V  V /
                                                                          |_|    |_|\___/ \_/\_/
```

[![codecov](https://codecov.io/gh/ricokahler/oauth2-popup-flow/branch/master/graph/badge.svg)](https://codecov.io/gh/ricokahler/oauth2-popup-flow)

### A very simple oauth2 implicit grant flow library<br>with no dependencies that uses `window.open`.

- Simplicity as a feature—only 209 SLOC.
- No dependencies.
- Easily integrates with React, Angular, Vue etc.
- Never interrupt or reload the state of your client to login.
- To get a token, call `oauth2PopupFlow.token()` which returns a `Promise<string>` of the token.
- To get the payload, call `oauth2PopupFlow.tokenPayload()` which returns a `Promise<TokenPayload>`.
- Statically typed API via Typescript for use within Javascript or Typescript.

### Why the popup?

If the user isn't logged in, the typical OAuth2 implicit grant flow forwards the user to the authorization server's login page (separate from your app) and then redirects them back. The issue with this is that it requires the app to be reloaded in order to grab a token. This reload complicates your application and may result in lost work due to the app reloading.

The popup is a simple solution that allows the user to load the hosted login page and come back to your app while keeping the state of your application.

### This library is great if:

- You already use the implicit grant
- Your authorization server typically doesn't prompt the user to login
- You want the user to automatically be logged in and authenticated in your application

## Usage

```
npm install --save oauth2-popup-flow
```

```ts
import { OAuth2PopupFlow } from 'oauth2-popup-flow';

// create a type for the payload of the token
interface TokenPayload {
  exp: number;
  other: string;
  stuff: string;
  username: string;
}

// create an instance of `OAuth2PopupFlow`
export const auth = new OAuth2PopupFlow<TokenPayload>({
  authorizationUri: 'https://example.com/oauth/authorize',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'http://localhost:8080/redirect',
  scope: 'openid profile',
});

// opens the login popup
// if the user is already logged in, it won't open the popup
auth.tryLoginPopup().then(result => {
  if (result === 'ALREADY_LOGGED_IN') {
    // ...
  } else if (result === 'POPUP_FAILED') {
    // ...
  } else if (result === 'SUCCESS') {
    // ...
  }
});

// synchronously returns whether or not the user is logged in
const loggedIn = auth.loggedIn();

async function someAsyncFunction() {
  // open the popup
  auth.tryLoginPopup();
  // await until authorized
  const token = await auth.token();

  const response = await fetch('https://example.com', {
    method: 'POST',
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
  });
}

async function getInfoFromToken() {
  // open the popup
  auth.tryLoginPopup();
  // returns the decoded payload of the token when authorized
  const payload = await auth.tokenPayload();
  return payload.username;
}

someAsyncFunction();
getInfoFromToken().then(username => console.log({ username }));

// also implements EventTarget so you can add event listeners for `login` and `logout`
auth.addEventListener('login', () => {
  console.log('user was logged in');
});

auth.addEventListener('logout', () => {
  console.log('user was logged out');
});
```

[Check out the API docs for more info](https://oauth2-popup-flow.netlify.com/)

### Examples (work-in-progress, contributions welcome)

- [No framework](./examples/vanilla)
- [Angular](./examples/angular)
- [React + React Router](./examples/react-example)

### Requirements

- [`String.prototype.startsWith`][0] (you may need a polyfill if you're targeting IE etc)

[0]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
