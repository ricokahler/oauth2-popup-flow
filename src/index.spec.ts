import { OAuth2PopupFlow } from './';

describe('OAuth2PopupFlow', () => {
  it('returns parsed JSON when valid', () => {
    const validJson = '{"a": "some value", "b": 5}';
    const parsed = OAuth2PopupFlow.jsonParseOrUndefined<{ a: string, b: number }>(validJson)!;
    expect(parsed).toBeDefined();
    expect(parsed.a).toBe('some value');
    expect(parsed.b).toBe(5);
  });
});
