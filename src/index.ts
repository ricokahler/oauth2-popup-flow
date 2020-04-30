import {
  jsonParseOrUndefined,
  decodeUriToObject,
  encodeObjectToUri,
  time,
} from './helpers';

declare const process: any;

/**
 * The type of the configuration object used to create a `OAuth2PopupFlow`
 *
 * Each property has a JSDOC description to explain what it does.
 */
export interface OAuth2PopupFlowOptions<TokenPayload extends { exp: number }> {
  /**
   * REQUIRED
   * The full URI of the authorization endpoint provided by the authorization server.
   *
   * e.g. `https://example.com/oauth/authorize`
   */
  authorizationUri: string;
  /**
   * REQUIRED
   * The client ID of your application provided by the authorization server.
   *
   * This client ID is sent to the authorization server using `authorizationUrl` endpoint in the
   * query portion of the URL along with the other parameters.
   * This value will be URL encoded like so:
   *
   * `https://example.com/oauth/authorize?client_id=SOME_CLIENT_ID_VALUE...`
   */
  clientId: string;
  /**
   * REQUIRED
   * The URI that the authorization server will to redirect after the user has been authenticated.
   * This redirect URI *must* be a URI from *your application* and it must also be registered with
   * the authorization server. Some authorities call this a "callback URLs" or "login URLs" etc.
   *
   * > e.g. `http://localhost:4200/redirect` for local testing
   * >
   * > or `https://my-application.com/redirect` for prod
   *
   * This redirect URI is sent to the authorization server using `authorizationUrl` endpoint in the
   * query portion of the URL along with the other parameters.
   * This value will be URL encoded like so:
   *
   * `https://example.com/oauth/authorize?redirect_URI=http%3A%2F%2Flocalhost%2Fredirect...`
   */
  redirectUri: string;
  /**
   * REQUIRED
   * A list permission separated by spaces that is the scope of permissions your application is
   * requesting from the authorization server. If the user is logging in the first time, it may ask
   * them to approve those permission before authorizing your application.
   *
   * > e.g. `openid profile`
   *
   * The scopes are sent to the authorization server using `authorizationUrl` endpoint in the
   * query portion of the URL along with the other parameters.
   * This value will be URL encoded like so:
   *
   * `https://example.com/oauth/authorize?scope=openid%20profile...`
   */
  scope: string;
  /**
   * OPTIONAL
   * `response_type` is an argument to be passed to the authorization server via the
   * `authorizationUri` endpoint in the query portion of the URL.
   *
   * Most implementations of oauth2 use the default value of `token` to tell the authorization
   * server to start the implicit grant flow but you may override that value with this option.
   *
   * For example, Auth0--an OAuth2 authority/authorization server--requires the value `id_token`
   * instead of `token` for the implicit flow.
   *
   * The response type is sent to the authorization server using `authorizationUrl` endpoint in the
   * query portion of the URL along with the other parameters.
   * This value will be URL encoded like so:
   *
   * `https://example.com/oauth/authorize?response_type=token...`
   */
  responseType?: string;
  /**
   * OPTIONAL
   * The key used to save the token in the given storage. The default key is `token` so the token
   * would be persisted in `localStorage.getItem('token')` if `localStorage` was the configured
   * `Storage`.
   */
  accessTokenStorageKey?: string;
  /**
   * OPTIONAL
   * During `handleRedirect`, the method will try to parse `window.location.hash` to an object using
   * `OAuth2PopupFlow.decodeUriToObject`. After that object has been decoded, this property
   * determines the key to use that will retrieve the token from that object.
   *
   * By default it is `access_token` but you you may need to change that e.g. Auth0 uses `id_token`.
   */
  accessTokenResponseKey?: string;
  /**
   * OPTIONAL
   * The storage implementation of choice. It can be `localStorage` or `sessionStorage` or something
   * else. By default, this is `localStorage` and `localStorage` is the preferred `Storage`.
   */
  storage?: Storage;
  /**
   * OPTIONAL
   * The `authenticated` method periodically checks `loggedIn()` and resolves when `loggedIn()`
   * returns `true`.
   *
   * This property is how long it will wait between checks. By default it is `200`.
   */
  pollingTime?: number;
  /**
   * OPTIONAL
   * Some oauth authorities require additional parameters to be passed to the `authorizationUri`
   * URL in order for the implicit grant flow to work.
   *
   * For example: [Auth0--an OAuth2 authority/authorization server--requires the parameters
   * `nonce`][0]
   * be passed along with every call to the `authorizationUri`. You can do that like so:
   *
   * ```ts
   * const auth = OAuth2PopupFlow({
   *   authorizationUri: 'https://example.com/oauth/authorize',
   *   clientId: 'foo_client',
   *   redirectUri: 'http://localhost:8080/redirect',
   *   scope: 'openid profile',
   *   // this can be a function or static object
   *   additionalAuthorizationParameters: () => {
   *     // in prod, consider something more cryptographic
   *     const nonce = Math.floor(Math.random() * 1000).toString();
   *     localStorage.setItem('nonce', nonce);
   *     return { nonce };
   *     // `nonce` will now be encoded in the URL like so:
   *     // https://example.com/oauth/authorize?client_id=foo_client...nonce=1234
   *   },
   *   // the token returned by Auth0, has the `nonce` in the payload
   *   // you can add this additional check now
   *   tokenValidator: ({ payload }) => {
   *     const storageNonce = parseInt(localStorage.getItem('nonce'), 10);
   *     const payloadNonce = parseInt(payload.nonce, 10);
   *     return storageNonce === payloadNonce;
   *   },
   * });
   * ```
   *
   * [0]: https://auth0.com/docs/api-auth/tutorials/nonce#generate-a-cryptographically-random-nonce
   */
  additionalAuthorizationParameters?:
    | (() => { [key: string]: string })
    | { [key: string]: string };
  /**
   * OPTIONAL
   * This function intercepts the `loggedIn` method and causes it to return early with `false` if
   * this function itself returns `false`. Use this function to validate claims in the token payload
   * or token.
   *
   * [For example: validating the `nonce`:][0]
   *
   * ```ts
   * const auth = OAuth2PopupFlow({
   *   authorizationUri: 'https://example.com/oauth/authorize',
   *   clientId: 'foo_client',
   *   redirectUri: 'http://localhost:8080/redirect',
   *   scope: 'openid profile',
   *   // this can be a function or static object
   *   additionalAuthorizationParameters: () => {
   *     // in prod, consider something more cryptographic
   *     const nonce = Math.floor(Math.random() * 1000).toString();
   *     localStorage.setItem('nonce', nonce);
   *     return { nonce };
   *     // `nonce` will now be encoded in the URL like so:
   *     // https://example.com/oauth/authorize?client_id=foo_client...nonce=1234
   *   },
   *   // the token returned by Auth0, has the `nonce` in the payload
   *   // you can add this additional check now
   *   tokenValidator: ({ payload }) => {
   *     const storageNonce = parseInt(localStorage.getItem('nonce'), 10);
   *     const payloadNonce = parseInt(payload.nonce, 10);
   *     return storageNonce === payloadNonce;
   *   },
   * });
   * ```
   *
   * [0]: https://auth0.com/docs/api-auth/tutorials/nonce#generate-a-cryptographically-random-nonce
   */
  tokenValidator?: (options: {
    payload: TokenPayload;
    token: string;
  }) => boolean;
  /**
   * OPTIONAL
   * A hook that runs in `tryLoginPopup` before any popup is opened. This function can return a
   * `Promise` and the popup will not open until it resolves.
   *
   * A typical use case would be to wait a certain amount of time before opening the popup to let
   * the user see why the popup is happening.
   */
  beforePopup?: () => any | Promise<any>;
  /**
   * OPTIONAL
   * A hook that runs in `handleRedirect` that takes in the result of the hash payload from the
   * authorization server. Use this hook to grab more from the response or to debug the response
   * from the authorization URL.
   */
  afterResponse?: (authorizationResponse: {
    [key: string]: string | undefined;
  }) => void;
}

function OAuth2PopupFlow<TokenPayload extends { exp: number }>({
  responseType = 'token',
  accessTokenStorageKey = 'token',
  accessTokenResponseKey = 'access_token',
  storage = localStorage,
  pollingTime = 200,
  ...opts
}: OAuth2PopupFlowOptions<TokenPayload>) {
  const eventListeners: {
    [type: string]: EventListenerOrEventListenerObject[];
  } = {};

  function _getRawToken() {
    return storage.getItem(accessTokenStorageKey) || undefined;
  }
  function _setRawToken(value: string | undefined) {
    if (value === null) return;
    if (value === undefined) return;

    storage.setItem(accessTokenStorageKey, value);
  }

  function _getRawTokenPayload() {
    const rawToken = _getRawToken();
    if (!rawToken) return undefined;

    const tokenSplit = rawToken.split('.');
    const encodedPayload = tokenSplit[1];
    if (!encodedPayload) return undefined;

    const decodedPayloadJson = window.atob(
      encodedPayload.replace('-', '+').replace('_', '/'),
    );
    const decodedPayload = jsonParseOrUndefined<TokenPayload>(
      decodedPayloadJson,
    );
    return decodedPayload;
  }

  /**
   * A simple synchronous method that returns whether or not the user is logged in by checking
   * whether or not their token is present and not expired.
   */
  function loggedIn() {
    const decodedPayload = _getRawTokenPayload();
    if (!decodedPayload) return false;

    if (opts.tokenValidator) {
      const token = _getRawToken()!;
      if (!opts.tokenValidator({ payload: decodedPayload, token }))
        return false;
    }

    const exp = decodedPayload.exp;
    if (!exp) return false;

    if (new Date().getTime() > exp * 1000) return false;
    return true;
  }

  /**
   * Returns true only if there is a token in storage and that token is expired. Use this to method
   * in conjunction with `loggedIn` to display a message like "you need to *re*login" vs "you need
   * to login".
   */
  function tokenExpired() {
    const decodedPayload = _getRawTokenPayload();
    if (!decodedPayload) return false;

    const exp = decodedPayload.exp;
    if (!exp) return false;

    if (new Date().getTime() <= exp * 1000) return false;

    return true;
  }

  /**
   * Deletes the token from the given storage causing `loggedIn` to return false on its next call.
   * Also dispatches `logout` event
   */
  function logout() {
    storage.removeItem(accessTokenStorageKey);
    dispatchEvent(new Event('logout'));
  }

  /**
   * Call this method in a route of the `redirectUri`. This method takes the value of the hash at
   * `window.location.hash` and attempts to grab the token from the URL.
   *
   * If the method was able to grab the token, it will return `'SUCCESS'` else it will return a
   * different string.
   */
  function handleRedirect() {
    const locationHref = window.location.href;
    if (!locationHref.startsWith(opts.redirectUri))
      return 'REDIRECT_URI_MISMATCH';

    const rawHash = window.location.hash;
    if (!rawHash) return 'FALSY_HASH';
    // this will always match
    const hashMatch = /#(.*)/.exec(rawHash)!;
    const hash = hashMatch[1];

    const authorizationResponse = decodeUriToObject(hash);
    if (opts.afterResponse) {
      opts.afterResponse(authorizationResponse);
    }
    const rawToken = authorizationResponse[accessTokenResponseKey];
    if (!rawToken) return 'FALSY_TOKEN';

    _setRawToken(rawToken);
    window.location.hash = '';
    return 'SUCCESS';
  }

  /**
   * supported events are:
   *
   * 1. `logout`–fired when the `logout()` method is called and
   * 2. `login`–fired during the `tryLoginPopup()` method is called and succeeds
   */
  function addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const listeners = eventListeners[type] || [];
    listeners.push(listener);
    eventListeners[type] = listeners;
  }

  /**
   * Use this to dispatch an event to the internal `EventTarget`
   */
  function dispatchEvent(event: Event) {
    const listeners = eventListeners[event.type] || [];
    for (const listener of listeners) {
      const dispatch =
        typeof listener === 'function'
          ? listener
          : typeof listener === 'object' &&
            typeof listener.handleEvent === 'function'
          ? listener.handleEvent.bind(listener)
          : () => {};

      dispatch(event);
    }
    return true;
  }

  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  function removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const listeners = eventListeners[type] || [];
    eventListeners[type] = listeners.filter((l) => l !== listener);
  }

  /**
   * Tries to open a popup to login the user in. If the user is already `loggedIn()` it will
   * immediately return `'ALREADY_LOGGED_IN'`. If the popup fails to open, it will immediately
   * return `'POPUP_FAILED'` else it will wait for `loggedIn()` to be `true` and eventually
   * return `'SUCCESS'`.
   *
   * Also dispatches `login` event
   */
  async function tryLoginPopup() {
    if (loggedIn()) return 'ALREADY_LOGGED_IN';

    if (opts.beforePopup) {
      await Promise.resolve(opts.beforePopup());
    }

    const additionalParams =
      typeof opts.additionalAuthorizationParameters === 'function'
        ? opts.additionalAuthorizationParameters()
        : typeof opts.additionalAuthorizationParameters === 'object'
        ? opts.additionalAuthorizationParameters
        : {};

    const popup = window.open(
      `${opts.authorizationUri}?${encodeObjectToUri({
        client_id: opts.clientId,
        response_type: responseType,
        redirect_uri: opts.redirectUri,
        scope: opts.scope,
        ...additionalParams,
      })}`,
    );
    if (!popup) return 'POPUP_FAILED';

    await authenticated();
    popup.close();
    dispatchEvent(new Event('login'));

    return 'SUCCESS';
  }

  /**
   * A promise that does not resolve until `loggedIn()` is true. This uses the `pollingTime`
   * to wait until checking if `loggedIn()` is `true`.
   */
  async function authenticated() {
    while (!loggedIn()) {
      await time(pollingTime);
    }
  }

  /**
   * If the user is `loggedIn()`, the token will be returned immediate, else it will open a popup
   * and wait until the user is `loggedIn()` (i.e. a new token has been added).
   */
  async function token() {
    await authenticated();
    return _getRawToken()!;
  }

  /**
   * If the user is `loggedIn()`, the token payload will be returned immediate, else it will open a
   * popup and wait until the user is `loggedIn()` (i.e. a new token has been added).
   */
  async function tokenPayload() {
    await authenticated();
    return _getRawTokenPayload()!;
  }

  return {
    responseType,
    accessTokenStorageKey,
    accessTokenResponseKey,
    storage,
    pollingTime,
    addEventListener,
    dispatchEvent,
    removeEventListener,
    loggedIn,
    logout,
    tokenExpired,
    handleRedirect,
    tryLoginPopup,
    authenticated,
    token,
    tokenPayload,
    ...(process.env.NODE_ENV !== 'production' && {
      _getRawToken,
      _setRawToken,
      _getRawTokenPayload,
    }),
    ...opts,
  };
}

const FixedTypesOAuth2PopupFlow = OAuth2PopupFlow as <
  TokenPayload extends { exp: number }
>(
  opts: OAuth2PopupFlowOptions<TokenPayload>,
) => Omit<
  ReturnType<typeof OAuth2PopupFlow>,
  '_getRawToken' | '_setRawToken' | '_getRawTokenPayload'
>;

export { FixedTypesOAuth2PopupFlow as OAuth2PopupFlow };
export default FixedTypesOAuth2PopupFlow;
