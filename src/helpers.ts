/**
 * wraps `JSON.parse` and return `undefined` if the parsing failed
 */
export function jsonParseOrUndefined<T = {}>(json: string) {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return undefined;
  }
}

/**
 * wraps `setTimeout` in a `Promise` that resolves to `'TIMER'`
 */
export function time(milliseconds: number) {
  return new Promise<'TIMER'>((resolve) =>
    window.setTimeout(() => resolve('TIMER'), milliseconds),
  );
}

/**
 * wraps `decodeURIComponent` and returns the original string if it cannot be decoded
 */
export function decodeUri(str: string) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Encodes an object of strings to a URL
 *
 * `{one: 'two', buckle: 'shoes or something'}` ==> `one=two&buckle=shoes%20or%20something`
 */
export function encodeObjectToUri(obj: { [key: string]: string }) {
  return Object.keys(obj)
    .map((key) => ({ key, value: obj[key] }))
    .map(
      ({ key, value }) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');
}

/**
 * Decodes a URL string to an object of string
 *
 * `one=two&buckle=shoes%20or%20something` ==> `{one: 'two', buckle: 'shoes or something'}`
 */
export function decodeUriToObject(str: string) {
  return str.split('&').reduce((decoded, keyValuePair) => {
    const [keyEncoded, valueEncoded] = keyValuePair.split('=');
    const key = decodeUri(keyEncoded);
    const value = decodeUri(valueEncoded);
    decoded[key] = value;
    return decoded;
  }, {} as { [key: string]: string | undefined });
}
