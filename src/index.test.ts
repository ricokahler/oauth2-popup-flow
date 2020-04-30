import { OAuth2PopupFlow } from './';
import { encodeObjectToUri, time } from './helpers';

interface ExampleTokenPayload {
  exp: number;
  foo: string;
  bar: number;
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
    removeItem: (key: string) => {
      delete _storage[key];
    },
    setItem: (key: string, value: string) => {
      _storage[key] = value;
    },
    _storage,
  };
}

describe('OAuth2PopupFlow', () => {
  describe('constructor', () => {
    it('creates instances from the `OAuth2PopupFlowOptions` object', () => {
      function beforePopup() {}
      function afterResponse() {}
      function tokenValidator() {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar' };

      const storage = createTestStorage();

      const options = {
        accessTokenResponseKey: 'test_response_key',
        accessTokenStorageKey: 'test_storage_key',
        additionalAuthorizationParameters,
        authorizationUri: 'http://example.com/oauth/authorize',
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

      const auth = OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.additionalAuthorizationParameters).toBe(
        additionalAuthorizationParameters,
      );
      expect(auth.authorizationUri).toBe(options.authorizationUri);
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
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = OAuth2PopupFlow(options);

      expect(auth.responseType).toBe('token');
    });
    it('uses the default `accessTokenStorageKey` of `token` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = OAuth2PopupFlow(options);

      expect(auth.accessTokenStorageKey).toBe('token');
    });
    it('uses the default `accessTokenResponseKey` of `access_token` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe('access_token');
    });
    it('uses the default `storage` of `window.localStorage` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = OAuth2PopupFlow(options);

      expect(auth.storage).toBe(window.localStorage);
    });
    it('uses the default `pollingTime` of `200` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        responseType: 'test_token',
        scope: 'test scope',
      };

      const auth = OAuth2PopupFlow(options);

      expect(auth.pollingTime).toBe(200);
    });
  });

  describe('_getRawToken/_setRawToken', () => {
    it('gets the raw token from storage', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'test_token';

      // @ts-ignore
      expect(auth._getRawToken()).toBe('test_token');
    });
    it('returns `undefined` if the value in storage is falsy', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = '';
      // @ts-ignore
      expect(auth._getRawToken()).toBeUndefined();

      storage._storage.token = null;
      // @ts-ignore
      expect(auth._getRawToken()).toBeUndefined();
    });
    it("doesn't allow `null` or `undefined` to be assigned to storage but allows strings", () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'initial value';

      // @ts-ignore
      auth._setRawToken(undefined);
      expect(storage._storage.token).toBe('initial value');

      // @ts-ignore
      auth._setRawToken(null);
      expect(storage._storage.token).toBe('initial value');
      // @ts-ignore

      auth._setRawToken('');
      expect(storage._storage.token).toBe('');

      // @ts-ignore
      auth._setRawToken('something');
      expect(storage._storage.token).toBe('something');
    });
  });

  describe('_getRawTokenPayload', () => {
    it('returns `undefined` if the `_getRawToken()` is falsy', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = undefined;
      // @ts-ignore
      expect(auth._getRawTokenPayload()).toBeUndefined();

      storage._storage.token = null;
      // @ts-ignore
      expect(auth._getRawTokenPayload()).toBeUndefined();

      storage._storage.token = '';
      // @ts-ignore
      expect(auth._getRawTokenPayload()).toBeUndefined();
    });
    it("returns `undefined` if it couldn't find the encoded payload in the token", () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'non-proper JWT';
      // @ts-ignore
      expect(auth._getRawTokenPayload()).toBeUndefined();
    });
    it("returns `undefined` if it couldn't parse the JSON in the encoded payload", () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = [
        'non proper JWT',
        'this is the payload section',
        'this is the signature section',
      ].join('.');

      // @ts-ignore
      expect(auth._getRawTokenPayload()).toBeUndefined();
    });
    it('returns a proper decoded payload', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');

      // @ts-ignore
      expect(auth._getRawTokenPayload()).toEqual(examplePayload);
    });
  });

  describe('loggedIn', () => {
    it('returns `false` if the `_getRawTokenPayload()` is undefined', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      let tokenValidatorCalled = false;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      let tokenValidatorCalled = false;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(true);
    });
  });

  describe('tokenExpired', () => {
    it('returns `false` if the `_getRawTokenPayload()` is undefined', () => {
      const storage = createTestStorage();

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = undefined;

      expect(auth.tokenExpired()).toBe(false);
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.tokenExpired()).toBe(false);
    });
    it('returns `false` if the token is not expired', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.tokenExpired()).toBe(false);
    });
    it('returns `true` if the token is expired', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) - 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.tokenExpired()).toBe(true);
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      expect(auth.loggedIn()).toBe(true);
      auth.logout();
      expect(auth.loggedIn()).toBe(false);
    });

    it('should dispatch a logout event', () => {
      const storage = createTestStorage();
      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });
      const handler = jest.fn();
      auth.addEventListener('logout', handler);

      expect(auth.loggedIn()).toBe(true);
      auth.logout();
      expect(auth.loggedIn()).toBe(false);
      expect(handler).toBeCalledTimes(1);
    });
  });

  describe('handleRedirect', () => {
    it("returns early with `REDIRECT_URI_MISMATCH` if location doesn't match the redirect", () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      window.location.hash = 'something%20else';

      const result = auth.handleRedirect();
      expect(result).toBe('REDIRECT_URI_MISMATCH');
    });
    it('returns early with `FALSY_HASH` if the hash is falsy', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      window.location.hash = '';

      const result = auth.handleRedirect();
      expect(result).toBe('FALSY_HASH');
    });
    // // this test won't pass because the js-dom environment will always add the `#` to the string
    // it('returns early with `NO_HASH_MATCH` if hash doesn\'t match /#(.*)/', () => {
    //   const storage = createTestStorage();

    //   const options = {
    //     authorizationUri: 'http://example.com/oauth/authorize',
    //     clientId: 'some_test_client',
    //     redirectUri: '',
    //     scope: 'openid profile',
    //     storage,
    //   };

    //   const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
    //   window.location.hash = 'shouldn\t match';

    //   const result = auth.handleRedirect();
    //   expect(result).toBe('NO_HASH_MATCH');
    // });
    it('calls `afterResponse` with the `decodeUriToObject`', () => {
      const storage = createTestStorage();

      let afterResponseCalled = false;

      const objectToEncode = {
        access_token: 'fake access token',
        one: 'something',
        two: 'something else',
      };

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        afterResponse: (obj: { [key: string]: string | undefined }) => {
          expect(obj).toEqual(objectToEncode);
          afterResponseCalled = true;
        },
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${encodeObjectToUri(objectToEncode)}`;

      const result = auth.handleRedirect();
      expect(result).toBe('SUCCESS');
      expect(afterResponseCalled).toBe(true);
    });
    it('returns early with `false` if `rawToken` is falsy', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${encodeObjectToUri({
        access_token: '',
      })}`;

      const result = auth.handleRedirect();
      expect(result).toBe('FALSY_TOKEN');
    });
    it('returns `SUCCESS` setting via `_setRawToken` and clearing the hash if token is valid', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      window.location.hash = `#${encodeObjectToUri({
        access_token: 'some token thing',
      })}`;

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      const result = auth.handleRedirect();
      expect(result).toBe('SUCCESS');
      expect(storage.getItem('token')).toBe('some token thing');
      expect(window.location.hash).toBe('');
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
        'this is the signature section',
      ].join('.');
      storage._storage.token = exampleToken;

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(true);
      expect(await auth.tryLoginPopup()).toBe('ALREADY_LOGGED_IN');
    });
    it("doesn't call `beforePopup` if it doesn't exist", async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
    });
    it('calls `beforePopup` synchronously', async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      let beforePopupCalled = false;

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        beforePopup: () => {
          beforePopupCalled = true;
        },
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(beforePopupCalled).toBe(true);
    });
    it('calls `beforePopup` asynchronously', async () => {
      const storage = createTestStorage();

      (window as any).open = () => undefined;

      let beforePopupCalled = false;

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        beforePopup: async () => {
          expect(await time(0)).toBe('TIMER');
          beforePopupCalled = true;
        },
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(beforePopupCalled).toBe(true);
    });
    it('calls `additionalAuthorizationParameters` if it is a function', async () => {
      const storage = createTestStorage();
      let openCalled = false;

      (window as any).open = (url: string) => {
        expect(url.includes('foo=bar')).toBe(true);
        openCalled = true;
      };

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        additionalAuthorizationParameters: () => {
          return {
            foo: 'bar',
          };
        },
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(openCalled).toBe(true);
    });
    it('uses `additionalAuthorizationParameters` if it is an object', async () => {
      const storage = createTestStorage();
      let openCalled = false;

      (window as any).open = (url: string) => {
        expect(url.includes('foo=bar')).toBe(true);
        openCalled = true;
      };

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
        additionalAuthorizationParameters: { foo: 'bar' },
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(openCalled).toBe(true);
    });
    it('returns `SUCCESS` and calls `close` on the popup and fires and event', async () => {
      const storage = createTestStorage();

      let closedCalled = false;
      let resolve!: () => void;
      const eventCalled = new Promise((thisResolve) => (resolve = thisResolve));

      (window as any).open = () => ({
        close: () => {
          closedCalled = true;
        },
      });

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      auth.addEventListener('login', resolve);
      time(0).then(() => {
        storage._storage.token = exampleToken;
      });

      expect(auth.loggedIn()).toBe(false);
      expect(await auth.tryLoginPopup()).toBe('SUCCESS');
      expect(closedCalled).toBe(true);
      await eventCalled;
    });
  });

  describe('authenticated', () => {
    it('only resolves after a `loggedIn()` is truthy', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
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
        'this is the signature section',
      ].join('.');

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      time(10).then(() => {
        storage._storage.token = exampleToken;
      });

      expect(auth.loggedIn()).toBe(false);
      // this won't resolve and the test will fail unless `loggedIn` is truthy
      await auth.authenticated();
    });
  });

  describe('token', () => {
    it('returns the `_getRawToken()` if `loggedIn()`', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section',
      ].join('.');

      storage._storage.token = exampleToken;

      const token = await auth.token();

      expect(token).toEqual(exampleToken);
    });
  });

  describe('tokenPayload', () => {
    it('returns the `_getRawToken` if `loggedIn()`', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);

      const examplePayload = {
        foo: 'something',
        bar: 5,
        exp: Math.floor(new Date().getTime() / 1000) + 1000,
      };
      const exampleToken = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section',
      ].join('.');

      storage._storage.token = exampleToken;

      const payload = await auth.tokenPayload();

      expect(payload).toEqual(examplePayload);
    });
  });

  describe('EventTarget', () => {
    it('allows events to be listened to and dispatched', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const handler = jest.fn();

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      auth.addEventListener('login', handler);
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));

      expect(handler).toBeCalledTimes(3);
    });

    it('allows event listeners to be removed', () => {
      const storage = createTestStorage();
      const handler = jest.fn();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      auth.addEventListener('login', handler);
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));

      auth.removeEventListener('login', handler);
      auth.dispatchEvent(new Event('login'));

      expect(handler).toBeCalledTimes(3);
    });

    it("doesn't throw when the type of event doesn't exist", () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      auth.removeEventListener('login', () => {});
    });

    it('allows for an event handler object', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      const handler = jest.fn();

      const eventListenerObject = {
        handleEvent: handler,
      };

      auth.addEventListener('login', eventListenerObject);
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));

      expect(handler).toBeCalledTimes(3);
    });

    it('defaults to a no-op when there is nothing callable', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = OAuth2PopupFlow<ExampleTokenPayload>(options);
      const handler = jest.fn();

      const notRealObj = {};

      auth.addEventListener('login', notRealObj as any);
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));
      auth.dispatchEvent(new Event('login'));

      expect(handler).toBeCalledTimes(0);
    });
  });
});
