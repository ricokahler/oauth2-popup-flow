import { OAuth2PopupFlow, OAuth2PopupFlowOptions } from './';

interface ExampleTokenPayload {
  exp: number,
  foo: string,
  bar: number,
}

function createTestStorage() {
  const _storage: { [key: string]: string | undefined | null } = {};
  return {
    clear: () => {
      for (const key of Object.keys(_storage)) {
        delete _storage[key];
      }
    },
    getItem: (key: string) => _storage[key] || null,
    key: (index: number) => Object.keys(_storage)[index] || null,
    length: Object.keys(_storage).length,
    removeItem: (key: string) => { delete _storage[key]; },
    setItem: (key: string, value: string) => { _storage[key] = value; },
    _storage,
  };
}

describe('OAuth2PopupFlow', () => {
  describe('jsonParseOrUndefined', () => {
    it('returns parsed JSON when valid', () => {
      const validJson = '{"a": "some value", "b": 5}';
      const parsed = OAuth2PopupFlow.jsonParseOrUndefined<{ a: string, b: number }>(validJson)!;
      expect(parsed).toBeDefined();
      expect(parsed.a).toBe('some value');
      expect(parsed.b).toBe(5);
    });
    it('returns undefined when the JSON is invalid', () => {
      const invalidJson = 'this aint json';
      const parsed = OAuth2PopupFlow.jsonParseOrUndefined(invalidJson);
      expect(parsed).toBeUndefined();
    });
  });

  describe('time', () => {
    it('calls `setTimeout` and returns `TIMER`', async () => {
      const timer = await OAuth2PopupFlow.time(10);
      expect(timer).toBe('TIMER');
    });
  });

  describe('decodeUri', () => {
    it('calls `decodeURIComponent` and returns its result', () => {
      const result = OAuth2PopupFlow.decodeUri('hello%20world');
      expect(result).toBe('hello world');
    });
    it('catches `decodeURIComponent` and returns the original string', () => {
      const notParsable = '%';
      const result = OAuth2PopupFlow.decodeUri(notParsable);
      expect(result).toBe(notParsable);
    });
  });

  describe('encodeObjectToUri', () => {
    it('encodes plain ole javascript objects of strings to a URI component', () => {
      const javascriptObject = { foo: 'some value', bar: 'some other value' };
      const encoded = OAuth2PopupFlow.encodeObjectToUri(javascriptObject);
      expect(encoded).toBe('foo=some%20value&bar=some%20other%20value');
    });
  });

  describe('decodeUriToObject', () => {
    it('decodes a URI into an object of strings', () => {
      const uri = 'foo=some%20value&bar=some%20other%20value';
      const decoded = OAuth2PopupFlow.decodeUriToObject(uri);
      expect(decoded).toEqual({ foo: 'some value', bar: 'some other value' });
    });
  });

  describe('constructor', () => {
    it('creates instances from the `OAuth2PopupFlowOptions` object', () => {
      function beforePopup() { }
      function afterResponse() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = createTestStorage();

      const options = {
        accessTokenResponseKey: 'test_response_key',
        accessTokenStorageKey: 'test_storage_key',
        additionalAuthorizationParameters,
        authorizationUrl: 'http://example.com/oauth/authorize',
        beforePopup,
        clientId: 'test_client_id',
        pollingTime: Math.random(),
        redirectUri: 'http://localhost:8080/redirect',
        responseType: 'test_token',
        scope: 'test scope',
        storage,
        tokenValidator,
        afterResponse,
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.additionalAuthorizationParameters).toBe(additionalAuthorizationParameters);
      expect(auth.authorizationUrl).toBe(options.authorizationUrl);
      expect(auth.beforePopup).toBe(beforePopup);
      expect(auth.clientId).toBe(options.clientId);
      expect(auth.pollingTime).toBe(options.pollingTime);
      expect(auth.redirectUri).toBe(options.redirectUri);
      expect(auth.responseType).toBe(options.responseType);
      expect(auth.scope).toBe(options.scope);
      expect(auth.storage).toBe(storage);
      expect(auth.tokenValidator).toBe(tokenValidator);
      expect(auth.afterResponse).toBe(afterResponse);
    });
    it('uses the default `responseType` of `token` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.responseType).toBe('token');
    });
    it('uses the default `accessTokenStorageKey` of `token` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenStorageKey).toBe('token');
    });
    it('uses the default `accessTokenResponseKey` of `access_token` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe('access_token');
    });
    it('uses the default `storage` of `window.localStorage` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.storage).toBe(window.localStorage);
    });
    it('uses the default `pollingTime` of `200` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        responseType: 'test_token',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.pollingTime).toBe(200);
    });
    it('uses the default `additionalAuthorizationParameters` of `{}` when none is present', () => {
      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.additionalAuthorizationParameters).toEqual({});
    });
  });

  describe('_rawToken', () => {
    it('gets the raw token from storage', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'test_token';

      expect(auth['_rawToken']).toBe('test_token');
    });
    it('returns `undefined` if the value in storage is falsy', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = '';
      expect(auth['_rawToken']).toBeUndefined();

      storage._storage.token = null;
      expect(auth['_rawToken']).toBeUndefined();
    });
    it('doesn\'t allow `null` or `undefined` to be assigned to storage but allows strings', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'initial value';

      auth['_rawToken'] = undefined;
      expect(storage._storage.token).toBe('initial value');

      (auth as any)['_rawToken'] = null;
      expect(storage._storage.token).toBe('initial value');

      auth['_rawToken'] = '';
      expect(storage._storage.token).toBe('');

      auth['_rawToken'] = 'something';
      expect(storage._storage.token).toBe('something');
    });
  });

  describe('_rawTokenPayload', () => {
    it('returns `undefined` if the `_rawToken` is falsy', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = undefined;
      expect(auth['_rawTokenPayload']).toBeUndefined();

      storage._storage.token = null;
      expect(auth['_rawTokenPayload']).toBeUndefined();

      storage._storage.token = '';
      expect(auth['_rawTokenPayload']).toBeUndefined();
    });
    it('returns `undefined` if it couldn\'t find the encoded payload in the token', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'non-proper JWT';
      expect(auth['_rawTokenPayload']).toBeUndefined();
    });
    it('returns `undefined` if it couldn\'t parse the JSON in the encoded payload', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = [
        'non proper JWT',
        'this is the payload section',
        'this is the signature section'
      ].join('.');

      expect(auth['_rawTokenPayload']).toBeUndefined();
    });
    it('returns a proper decoded payload', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000),
      };

      storage._storage.token = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');

      expect(auth['_rawTokenPayload']).toEqual(examplePayload);
    });
  });

  describe('loggedIn', () => {
    it('returns `false` if the `_rawTokenPayload` is undefined', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = undefined;

      expect(auth.loggedIn()).toBe(false);
    });
    it('passes through the `tokenValidator` with `true`', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      let tokenValidatorCalled = false;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
        tokenValidator: ({ token, payload }) => {
          expect(token).toBe(exampleToken);
          expect(payload).toEqual(examplePayload);
          tokenValidatorCalled = true;
          return true;
        },
      });

      expect(auth.loggedIn()).toBe(true);
      expect(tokenValidatorCalled).toBe(true);
    });
    it('returns `false` if there is a `tokenValidator` and that returns false', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000),
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      let tokenValidatorCalled = false;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
        tokenValidator: ({ token, payload }) => {
          expect(token).toBe(exampleToken);
          expect(payload).toEqual(examplePayload);
          tokenValidatorCalled = true;
          return false;
        },
      });

      expect(auth.loggedIn()).toBe(false);
      expect(tokenValidatorCalled).toBe(true);
    });
    it('returns `false` if the `exp` in the payload is falsy', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: 0,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(false);
    });
    it('returns `false` if the token is expired', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) - 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(false);
    });
    it('returns `true` if the token is good', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should remove the token from storage', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(true);
      auth.logout();
      expect(auth.loggedIn()).toBe(false);
    });
  });

  describe('handleRedirect', () => {
    it('returns early with `false` if location.href doesn\'t `startWith` the `redirectUri`', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      window.location.hash = 'something%20else';

      const result = auth.handleRedirect();
      expect(result).toBe(false);
    });
    it('returns early with `false` if the hash is falsy', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      window.location.hash = '';

      const result = auth.handleRedirect();
      expect(result).toBe(false);
    });
    it('returns early with `false` if hash doesn\'t match /#(.*)/', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = 'shouldn\t match';

      const result = auth.handleRedirect();
      expect(result).toBe(false);
    });
    it('calls `afterResponse` with the `decodeUriToObject`', () => {
      const storage = createTestStorage();

      let afterResponseCalled = false;

      const objectToEncode = {
        access_token: 'fake access token',
        one: 'something',
        two: 'something else',
      };

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        afterResponse: (obj: { [key: string]: string | undefined }) => {
          expect(obj).toEqual(objectToEncode);
          afterResponseCalled = true;
        }
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${OAuth2PopupFlow.encodeObjectToUri(objectToEncode)}`;

      const result = auth.handleRedirect();
      expect(result).toBe(true);
      expect(afterResponseCalled).toBe(true);
    });
    it('returns early with `false` if `rawToken` is falsy', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${OAuth2PopupFlow.encodeObjectToUri({
        access_token: '',
      })}`;

      const result = auth.handleRedirect();
      expect(result).toBe(false);
    });
    it('returns `true` setting the `_rawToken` if the token is good', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      window.location.hash = `#${OAuth2PopupFlow.encodeObjectToUri({
        access_token: 'some token thing',
      })}`;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      const result = auth.handleRedirect();
      expect(result).toBe(true);
      expect(storage.getItem('token')).toBe('some token thing');
    });
  });

  describe('tryLoginPopup', () => {
    it('returns `ALREADY_LOGGED_IN` if already `loggedIn()`', async () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(true);
      expect(await auth.tryLoginPopup()).toBe('ALREADY_LOGGED_IN');
    });
    it('doesn\'t call `beforePopup` if it doesn\'t exist', async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
    });
    it('calls `beforePopup` synchronously', async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      let beforePopupCalled = false;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        beforePopup: () => {
          beforePopupCalled = true;
        },
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(beforePopupCalled).toBe(true);
    });
    it('calls `beforePopup` asynchronously', async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      let beforePopupCalled = false;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        beforePopup: async () => {
          expect(await OAuth2PopupFlow.time(0)).toBe('TIMER');
          beforePopupCalled = true;
        },
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(beforePopupCalled).toBe(true);
    });
    it('returns `LOGIN_TIMEOUT` if `authenticated()` doesn\'t resolve', async () => {
      const storage = createTestStorage();

      (window as any).open = () => ({
        close: () => undefined,
      });

      let beforePopupCalled = false;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        loginTimeout: 0,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('LOGIN_TIMEOUT');
    });
    it('returns `SUCCESS` and calls `close` on the popup', async () => {
      const storage = createTestStorage();

      let closedCalled = false;

      (window as any).open = () => ({
        close: () => {
          closedCalled = true;
        },
      });

      let beforePopupCalled = false;

      const options = {
        authorizationUrl: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('SUCCESS');
      expect(closedCalled).toBe(true);
    });
  });
});
