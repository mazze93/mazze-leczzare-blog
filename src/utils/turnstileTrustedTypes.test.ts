import { describe, expect, it } from 'vitest';
import {
  TURNSTILE_SCRIPT_SRC,
  TURNSTILE_TT_POLICY_NAME,
  allowTurnstileScriptUrlOnly,
  createTurnstileScriptUrlPolicy,
  type TrustedTypesFactoryLike,
} from './turnstileTrustedTypes';

// Stand-in for window.trustedTypes: records the policy name and wraps the
// rule's output the way a real factory wraps it in a TrustedScriptURL.
function fakeFactory() {
  const names: string[] = [];
  const factory: TrustedTypesFactoryLike = {
    createPolicy(name, rules) {
      names.push(name);
      return { createScriptURL: (input) => ({ toString: () => rules.createScriptURL(input) }) };
    },
  };
  return { factory, names };
}

describe('turnstile Trusted Types policy', () => {
  it('passes the exact Turnstile URL through', () => {
    expect(allowTurnstileScriptUrlOnly(TURNSTILE_SCRIPT_SRC)).toBe(TURNSTILE_SCRIPT_SRC);
  });

  it.each([
    'https://evil.example/turnstile/v0/api.js',
    'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=x',
    'https://challenges.cloudflare.com/turnstile/v1/api.js',
    'http://challenges.cloudflare.com/turnstile/v0/api.js',
    '//challenges.cloudflare.com/turnstile/v0/api.js',
    'data:text/javascript,alert(1)',
    'javascript:alert(1)',
    '',
  ])('rejects non-Turnstile URL %j', (url) => {
    expect(() => allowTurnstileScriptUrlOnly(url)).toThrow(TypeError);
  });

  it('registers one narrowly named policy that enforces the allowlist', () => {
    const { factory, names } = fakeFactory();
    const policy = createTurnstileScriptUrlPolicy(factory);
    expect(names).toEqual([TURNSTILE_TT_POLICY_NAME]);
    expect(String(policy?.createScriptURL(TURNSTILE_SCRIPT_SRC))).toBe(TURNSTILE_SCRIPT_SRC);
    expect(() => String(policy?.createScriptURL('https://evil.example/x.js'))).toThrow(TypeError);
  });

  it('returns null where Trusted Types is unsupported', () => {
    expect(createTurnstileScriptUrlPolicy(undefined)).toBeNull();
  });
});
