This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# OAuth2 Popup Flow–React and React-Router Example

There are more than one way to approach integrating OAuth2 Popup Flow with React and React-Router. The following is one example and assumes you know how react-router works.

## Running the demo

```bash
git clone https://github.com/ricokahler/oauth2-popup-flow.git
cd oauth2-popup-flow/examples/react-example
npm install
npm start
```

### Installation instructions

```
npm install --save oauth2-popup-flow
```

## How it works

### Review of the implicit grant/flow with a popup:

1. User clicks "Login" button. This will open the authorization page/login page in a new tab.
2. User enters their login info in the authorization page.
3. Authorization server redirect the user's browser (still in that new tab) to the configured redirect/callback URL including an encoded token in the `#` of the redirect URL (e.g. `http://localhost:8080/redirect#access_token=SOME.TOKEN.HERE`)
4. Based on the `/redirect` route, front-end will handle the redirect and try to parse the token out of the URL. If this is successful, the new tab will close.
5. Original tab will receive tokens and normal app flow continues.

### Example app overview

1. `App` is the first component rendered and includes a common `AppBar` and `react-router`'s `<Switch>` component.
2. The `App` supports 3 routes:
   1. `/authenticated` which will only render when the user is logged in.
   2. `/unauthenticated` which will render when the user is not logged in.
   3. `/redirect` which will render to handle the redirect/callback the authorization server redirect the user back to.
3. The `App` component add event listeners to the `auth` singleton for both `login` and `logout` events. The handlers on those events call `history.push` or `history.replace` to either push or redirect the user to the correct routes (`/authenticated` and `/unauthenticated` respectively).
4. The `Redirect` component/route calls `auth.handleRedirect()` to handle the redirect and cause the calling window to close the tab.

The key files to look at are:

1. [auth.js](./src/auth.js)–creates the auth singleton
2. [App.js](./src/App.js)–manages top-level routing
3. [AuthenticatedRoute.js](./src/AuthenticatedRoute.js)–the authenticated route
4. [UnauthenticatedRoute.js](./src/UnauthenticatedRoute.js)–the unauthenticated route/login call to action
5. [Redirect.js](./src/Redirect.js)–handles the redirect from the authorization server.


Enjoy!
