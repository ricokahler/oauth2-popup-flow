import {
  jsonParseOrUndefined,
  decodeUri,
  decodeUriToObject,
  encodeObjectToUri,
  time,
} from './helpers';

describe('jsonParseOrUndefined', () => {
  it('returns parsed JSON when valid', () => {
    const validJson = '{"a": "some value", "b": 5}';
    const parsed = jsonParseOrUndefined<{
      a: string;
      b: number;
    }>(validJson)!;
    expect(parsed).toBeDefined();
    expect(parsed.a).toBe('some value');
    expect(parsed.b).toBe(5);
  });
  it('returns undefined when the JSON is invalid', () => {
    const invalidJson = 'this aint json';
    const parsed = jsonParseOrUndefined(invalidJson);
    expect(parsed).toBeUndefined();
  });
});

describe('time', () => {
  it('calls `setTimeout` and returns `TIMER`', async () => {
    function fiveMilliseconds() {
      return new Promise<5>((resolve) => setTimeout(() => resolve(5), 5));
    }

    const race = await Promise.race([time(10), fiveMilliseconds()]);
    expect(race).toBe(5);

    const otherRace = await Promise.race([time(0), fiveMilliseconds()]);
    expect(otherRace).toBe('TIMER');
  });
});

describe('decodeUri', () => {
  it('calls `decodeURIComponent` and returns its result', () => {
    const result = decodeUri('hello%20world');
    expect(result).toBe('hello world');
  });
  it('catches `decodeURIComponent` and returns the original string', () => {
    const notParsable = '%';
    const result = decodeUri(notParsable);
    expect(result).toBe(notParsable);
  });
});

describe('encodeObjectToUri', () => {
  it('encodes plain ole javascript objects of strings to a URI component', () => {
    const javascriptObject = { foo: 'some value', bar: 'some other value' };
    const encoded = encodeObjectToUri(javascriptObject);
    expect(encoded).toBe('foo=some%20value&bar=some%20other%20value');
  });
});

describe('decodeUriToObject', () => {
  it('decodes a URI into an object of strings', () => {
    const uri = 'foo=some%20value&bar=some%20other%20value';
    const decoded = decodeUriToObject(uri);
    expect(decoded).toEqual({ foo: 'some value', bar: 'some other value' });
  });
});
