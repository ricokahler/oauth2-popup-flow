/**
 * The type of the configuration object used to create a `OAuth2PopupFlow`
 * 
 * Each property has a JSDOC description to explain what it does.
 */
export interface OAuth2PopupFlowOptions<TokenPayload extends { exp: number }> {
  /**
   * The full URI of the authorization endpoint provided by the authorization server.
   * 
   * e.g. `https://example.com/oauth/authorize`
   */
  authorizationUri: string,
  /**
   * The client ID of your application provided by the authorization server. This client ID is sent
   * to the authorization server using `authorizationUrl` endpoint in the query portion of the URL
   * along with the other parameters.
   * 
   * e.g. `https://example.com/oauth/authorize?client_id=CLIENT_ID_VALUE...`
   */
  clientId: string,
  /**
   * The URI that the authorization server will to redirect after the user has been authenticated.
   * The authorization server will add a hash (i.e. `#`) to the redirect URI so it can be parsed
   */
  redirectUri: string,
  scope: string,
  responseType?: string,
  accessTokenStorageKey?: string,
  accessTokenResponseKey?: string,
  storage?: Storage,
  pollingTime?: number,
  additionalAuthorizationParameters?: { [key: string]: string },
  tokenValidator?: (options: { payload: TokenPayload, token: string }) => boolean,
  beforePopup?: () => any | Promise<any>,
  afterResponse?: (authorizationResponse: { [key: string]: string | undefined }) => void,
}

export class OAuth2PopupFlow<TokenPayload extends { exp: number }> {
  authorizationUri: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  accessTokenStorageKey: string;
  accessTokenResponseKey: string;
  storage: Storage;
  pollingTime: number;
  additionalAuthorizationParameters: { [key: string]: string };
  tokenValidator?: (options: { payload: TokenPayload, token: string }) => boolean;
  beforePopup?: () => any | Promise<any>;
  afterResponse?: (authorizationResponse: { [key: string]: string | undefined }) => void;

  constructor(options: OAuth2PopupFlowOptions<TokenPayload>) {
    this.authorizationUri = options.authorizationUri;
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.responseType = options.responseType || 'token';
    this.accessTokenStorageKey = options.accessTokenStorageKey || 'token';
    this.accessTokenResponseKey = options.accessTokenResponseKey || 'access_token';
    this.storage = options.storage || window.localStorage;
    this.pollingTime = options.pollingTime || 200;
    this.additionalAuthorizationParameters = options.additionalAuthorizationParameters || {};
    this.tokenValidator = options.tokenValidator;
    this.beforePopup = options.beforePopup;
    this.afterResponse = options.afterResponse;
  }

  private get _rawToken() {
    return this.storage.getItem(this.accessTokenStorageKey) || undefined;
  }
  private set _rawToken(value: string | undefined) {
    if (value === null) { return; }
    if (value === undefined) { return; }
    this.storage.setItem(this.accessTokenStorageKey, value);
  }

  private get _rawTokenPayload() {
    const rawToken = this._rawToken;
    if (!rawToken) { return undefined; }

    const tokenSplit = rawToken.split('.');
    const encodedPayload = tokenSplit[1];
    if (!encodedPayload) { return undefined; }

    const decodedPayloadJson = window.atob(encodedPayload);
    const decodedPayload = OAuth2PopupFlow.jsonParseOrUndefined<TokenPayload>(
      decodedPayloadJson
    );
    return decodedPayload;
  }

  loggedIn() {
    const decodedPayload = this._rawTokenPayload;
    if (!decodedPayload) { return false; }

    if (this.tokenValidator) {
      const token = this._rawToken!;
      if (!this.tokenValidator({ payload: decodedPayload, token })) { return false; }
    }

    const exp = decodedPayload.exp;
    if (!exp) { return false; }

    if (new Date().getTime() > exp * 1000) { return false; }

    return true;
  }

  logout() {
    this.storage.removeItem(this.accessTokenStorageKey);
  }

  handleRedirect() {
    const locationHref = window.location.href;
    if (!locationHref.startsWith(this.redirectUri)) { return 'REDIRECT_URI_MISMATCH'; }
    const rawHash = window.location.hash;
    if (!rawHash) { return 'FALSY_HASH'; }
    const hashMatch = /#(.*)/.exec(rawHash);
    if (!hashMatch) { return 'NO_HASH_MATCH'; }
    const hash = hashMatch[1];

    const authorizationResponse = OAuth2PopupFlow.decodeUriToObject(hash);
    if (this.afterResponse) {
      this.afterResponse(authorizationResponse);
    }
    const rawToken = authorizationResponse[this.accessTokenResponseKey];
    if (!rawToken) { return 'FALSY_TOKEN'; }
    this._rawToken = rawToken;
    window.location.hash = '';
    return 'SUCCESS';
  }

  async tryLoginPopup() {
    if (this.loggedIn()) { return 'ALREADY_LOGGED_IN'; }

    if (this.beforePopup) {
      await Promise.resolve(this.beforePopup());
    }

    const popup = window.open(`${this.authorizationUri}?${OAuth2PopupFlow.encodeObjectToUri({
      client_id: this.clientId,
      response_type: this.responseType,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      ...this.additionalAuthorizationParameters,
    })}`);
    if (!popup) { return 'POPUP_FAILED'; }

    await this.authenticated();

    popup.close();

    return 'SUCCESS';
  }

  async authenticated() {
    while (!this.loggedIn()) {
      await OAuth2PopupFlow.time(this.pollingTime);
    }
  }

  async token() {
    if (!this.loggedIn()) {
      this.tryLoginPopup();
      await this.authenticated();
    }
    const token = this._rawToken;
    if (!token) {
      throw new Error('Token was falsy after being authenticated.');
    }
    return token;
  }

  async tokenPayload() {
    if (!this.loggedIn()) {
      this.tryLoginPopup();
      await this.authenticated();
    }
    const payload = this._rawTokenPayload;
    if (!payload) {
      throw new Error('Token payload was falsy after being authenticated.');
    }
    return payload;
  }

  static jsonParseOrUndefined<T = {}>(json: string) {
    try {
      return JSON.parse(json) as T;
    } catch (e) {
      return undefined;
    }
  }

  static time(milliseconds: number) {
    return new Promise<'TIMER'>(resolve => window.setTimeout(
      () => resolve('TIMER'),
      milliseconds
    ));
  }

  /**
   * wraps `decodeURIComponent` and returns the original string if it cannot be decoded
   */
  static decodeUri(str: string) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  static encodeObjectToUri(obj: { [key: string]: string }) {
    return (Object
      .keys(obj)
      .map(key => ({ key, value: obj[key] }))
      .map(({ key, value }) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    );
  }

  static decodeUriToObject(str: string) {
    return str.split('&').reduce((decoded, keyValuePair) => {
      const [keyEncoded, valueEncoded] = keyValuePair.split('=');
      const key = this.decodeUri(keyEncoded);
      const value = this.decodeUri(valueEncoded);
      decoded[key] = value;
      return decoded;
    }, {} as { [key: string]: string | undefined });
  }
}
