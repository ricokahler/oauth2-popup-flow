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
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = {} as Storage;

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
    });
    it('uses the default `responseType` of `token` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = {} as Storage;

      const options = {
        accessTokenResponseKey: 'test_response_key',
        accessTokenStorageKey: 'test_storage_key',
        additionalAuthorizationParameters,
        authorizationUrl: 'http://example.com/oauth/authorize',
        beforePopup,
        clientId: 'test_client_id',
        pollingTime: Math.random(),
        redirectUri: 'http://localhost:8080/redirect',
        scope: 'test scope',
        storage,
        tokenValidator,
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.responseType).toBe('token');

      // copied from other tests
      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.additionalAuthorizationParameters).toBe(additionalAuthorizationParameters);
      expect(auth.authorizationUrl).toBe(options.authorizationUrl);
      expect(auth.beforePopup).toBe(beforePopup);
      expect(auth.clientId).toBe(options.clientId);
      expect(auth.pollingTime).toBe(options.pollingTime);
      expect(auth.redirectUri).toBe(options.redirectUri);
      expect(auth.scope).toBe(options.scope);
      expect(auth.storage).toBe(storage);
      expect(auth.tokenValidator).toBe(tokenValidator);
    });
    it('uses the default `accessTokenStorageKey` of `token` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = {} as Storage;

      const options = {
        accessTokenResponseKey: 'test_response_key',
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
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenStorageKey).toBe('token');

      // copied from other tests
      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
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
    });
    it('uses the default `accessTokenResponseKey` of `access_token` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = {} as Storage;

      const options = {
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
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.accessTokenResponseKey).toBe('access_token');

      // copied from other tests
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
    });
    it('uses the default `storage` of `localStorage` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

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
        tokenValidator,
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.storage).toBe(window.localStorage);

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
      expect(auth.tokenValidator).toBe(tokenValidator);
    });
    it('uses the default `pollingTime` of `200` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }
      const additionalAuthorizationParameters = { foo: 'bar', };

      const storage = {} as Storage;

      const options = {
        accessTokenResponseKey: 'test_response_key',
        accessTokenStorageKey: 'test_storage_key',
        additionalAuthorizationParameters,
        authorizationUrl: 'http://example.com/oauth/authorize',
        beforePopup,
        clientId: 'test_client_id',
        redirectUri: 'http://localhost:8080/redirect',
        responseType: 'test_token',
        scope: 'test scope',
        storage,
        tokenValidator,
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.pollingTime).toBe(200);

      // copied from other tests
      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.additionalAuthorizationParameters).toBe(additionalAuthorizationParameters);
      expect(auth.authorizationUrl).toBe(options.authorizationUrl);
      expect(auth.beforePopup).toBe(beforePopup);
      expect(auth.clientId).toBe(options.clientId);
      expect(auth.redirectUri).toBe(options.redirectUri);
      expect(auth.responseType).toBe(options.responseType);
      expect(auth.scope).toBe(options.scope);
      expect(auth.storage).toBe(storage);
      expect(auth.tokenValidator).toBe(tokenValidator);
    });
    it('uses the default `additionalAuthorizationParameters` of `{}` when none is present', () => {
      function beforePopup() { }
      function tokenValidator(options: { token: string, payload: ExampleTokenPayload }) {
        return true;
      }

      const storage = {} as Storage;

      const options = {
        accessTokenResponseKey: 'test_response_key',
        accessTokenStorageKey: 'test_storage_key',
        authorizationUrl: 'http://example.com/oauth/authorize',
        beforePopup,
        clientId: 'test_client_id',
        pollingTime: Math.random(),
        redirectUri: 'http://localhost:8080/redirect',
        responseType: 'test_token',
        scope: 'test scope',
        storage,
        tokenValidator,
      };

      const auth = new OAuth2PopupFlow(options);

      expect(auth.additionalAuthorizationParameters).toEqual({});

      // copied from other tests
      expect(auth.accessTokenResponseKey).toBe(options.accessTokenResponseKey);
      expect(auth.accessTokenStorageKey).toBe(options.accessTokenStorageKey);
      expect(auth.authorizationUrl).toBe(options.authorizationUrl);
      expect(auth.beforePopup).toBe(beforePopup);
      expect(auth.clientId).toBe(options.clientId);
      expect(auth.pollingTime).toBe(options.pollingTime);
      expect(auth.redirectUri).toBe(options.redirectUri);
      expect(auth.responseType).toBe(options.responseType);
      expect(auth.scope).toBe(options.scope);
      expect(auth.storage).toBe(storage);
      expect(auth.tokenValidator).toBe(tokenValidator);
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
        exp: Math.floor(new Date().getTime() / 1000)
      };

      storage._storage.token = [
        'blah blah header',
        window.btoa(JSON.stringify(examplePayload)),
        'this is the signature section'
      ].join('.');

      expect(auth['_rawTokenPayload']).toEqual(examplePayload);
    });
  });
});
