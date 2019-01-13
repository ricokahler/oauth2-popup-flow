import { OAuth2PopupFlow } from './';

export class DeferredPromise<T> implements Promise<T> {
  private _promise: Promise<T>;
  resolve!: (t?: T) => void;
  reject!: (error?: any) => void;
  then: <TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) => Promise<TResult1 | TResult2>;
  catch: <TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ) => Promise<T | TResult>;
  state: 'pending' | 'fulfilled' | 'rejected';

  constructor() {
    this.state = 'pending';
    this._promise = new Promise((resolve, reject) => {
      this.resolve = (value?: T | PromiseLike<T> | undefined) => {
        this.state = 'fulfilled';
        resolve(value);
      };
      this.reject = (reason: any) => {
        this.state = 'rejected';
        reject(reason);
      };
    });
    this.then = this._promise.then.bind(this._promise) as any;
    this.catch = this._promise.catch.bind(this._promise) as any;
  }

  [Symbol.toStringTag] = 'Promise' as 'Promise';
}

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
  describe('jsonParseOrUndefined', () => {
    it('returns parsed JSON when valid', () => {
      const validJson = '{"a": "some value", "b": 5}';
      const parsed = OAuth2PopupFlow.jsonParseOrUndefined<{ a: string; b: number }>(validJson)!;
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
      function fiveMilliseconds() {
        return new Promise<5>(resolve => setTimeout(() => resolve(5), 5));
      }

      const race = await Promise.race([OAuth2PopupFlow.time(10), fiveMilliseconds()]);
      expect(race).toBe(5);

      const otherRace = await Promise.race([OAuth2PopupFlow.time(0), fiveMilliseconds()]);
      expect(otherRace).toBe('TIMER');
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

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.additionalAuthorizationParameters).toBe(additionalAuthorizationParameters);
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

      const auth = new OAuth2PopupFlow(options);

      expect(auth.responseType).toBe('token');
    });
    it('uses the default `accessTokenStorageKey` of `token` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenStorageKey).toBe('token');
    });
    it('uses the default `accessTokenResponseKey` of `access_token` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe('access_token');
    });
    it('uses the default `storage` of `window.localStorage` when none is present', () => {
      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
      };

      const auth = new OAuth2PopupFlow(options);

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

      const auth = new OAuth2PopupFlow(options);

      expect(auth.pollingTime).toBe(200);
    });
  });

  describe('_rawToken', () => {
    it('gets the raw token from storage', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        authorizationUri: 'http://example.com/oauth/authorize',
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
    it("doesn't allow `null` or `undefined` to be assigned to storage but allows strings", () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
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
        authorizationUri: 'http://example.com/oauth/authorize',
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
    it("returns `undefined` if it couldn't find the encoded payload in the token", () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'openid profile',
        storage,
      });

      storage._storage.token = 'non-proper JWT';
      expect(auth['_rawTokenPayload']).toBeUndefined();
    });
    it("returns `undefined` if it couldn't parse the JSON in the encoded payload", () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow({
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

      expect(auth['_rawTokenPayload']).toBeUndefined();
    });
    it('returns a proper decoded payload', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      expect(auth['_rawTokenPayload']).toEqual(examplePayload);
    });
  });

  describe('loggedIn', () => {
    it('returns `false` if the `_rawTokenPayload` is undefined', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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
    it('returns `false` if the `_rawTokenPayload` is undefined', () => {
      const storage = createTestStorage();

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>({
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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

    //   const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${OAuth2PopupFlow.encodeObjectToUri(objectToEncode)}`;

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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      window.location.hash = `#${OAuth2PopupFlow.encodeObjectToUri({
        access_token: '',
      })}`;

      const result = auth.handleRedirect();
      expect(result).toBe('FALSY_TOKEN');
    });
    it('returns `SUCCESS` setting the `_rawToken` and clearing the hash if token is valid', () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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
        authorizationUri: 'http://example.com/oauth/authorize',
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(await auth.tryLoginPopup()).toBe('POPUP_FAILED');
      expect(openCalled).toBe(true);
    });
    it('returns `SUCCESS` and calls `close` on the popup and fires and event', async () => {
      const storage = createTestStorage();

      let closedCalled = false;
      const eventCalled = new DeferredPromise();

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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      auth.addEventListener('login', eventCalled.resolve);
      OAuth2PopupFlow.time(0).then(() => {
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
      OAuth2PopupFlow.time(10).then(() => {
        storage._storage.token = exampleToken;
      });

      expect(auth.loggedIn()).toBe(false);
      // this won't resolve and the test will fail unless `loggedIn` is truthy
      await auth.authenticated();
    });
  });

  describe('token', () => {
    it('returns the `_rawToken` if `loggedIn()`', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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
    it('throws if `_rawToken` was falsy after being authenticated', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      spyOn(auth, 'authenticated');

      let catchCalled = false;

      try {
        await auth.token();
      } catch (e) {
        expect(e.message).toBe('Token was falsy after being authenticated.');
        catchCalled = true;
      } finally {
        expect(catchCalled).toBe(true);
      }
    });
  });

  describe('tokenPayload', () => {
    it('returns the `_rawToken` if `loggedIn()`', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

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
    it('throws if `_rawToken` was falsy after being authenticated', async () => {
      const storage = createTestStorage();

      const options = {
        authorizationUri: 'http://example.com/oauth/authorize',
        clientId: 'some_test_client',
        redirectUri: '',
        scope: 'openid profile',
        storage,
      };

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);

      expect(auth.loggedIn()).toBe(false);
      spyOn(auth, 'authenticated');

      let catchCalled = false;

      try {
        await auth.tokenPayload();
      } catch (e) {
        expect(e.message).toBe('Token payload was falsy after being authenticated.');
        catchCalled = true;
      } finally {
        expect(catchCalled).toBe(true);
      }
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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

      const auth = new OAuth2PopupFlow<ExampleTokenPayload>(options);
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
