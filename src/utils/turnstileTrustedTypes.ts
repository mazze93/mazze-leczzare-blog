/**
 * Trusted Types policy for the lazily loaded Cloudflare Turnstile script.
 *
 * `HTMLScriptElement.src` is a Trusted Types sink: under
 * `require-trusted-types-for 'script'` it only accepts a `TrustedScriptURL`.
 * This module owns the one policy allowed to mint that value, and it accepts
 * exactly one URL. Anything else throws, so a future edit cannot quietly turn
 * the loader into a generic script injector.
 *
 * Where Trusted Types is unsupported, callers get the plain string back: the
 * browser does no sink check there, and the URL is still the fixed constant.
 */

export const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/** Policy name. List it in a future `trusted-types` CSP directive. */
export const TURNSTILE_TT_POLICY_NAME = 'turnstile-script-url';

/**
 * Minimal structural types. The TypeScript DOM lib in use does not declare
 * Trusted Types, so the surface this module touches is described here.
 */
export interface TrustedScriptURLLike {
  toString(): string;
}

export interface ScriptUrlPolicy {
  createScriptURL(input: string): TrustedScriptURLLike;
}

export interface TrustedTypesFactoryLike {
  createPolicy(
    name: string,
    rules: { createScriptURL: (input: string) => string },
  ): ScriptUrlPolicy;
}

/** The policy rule: pass the exact Turnstile URL through, reject the rest. */
export function allowTurnstileScriptUrlOnly(input: string): string {
  if (input !== TURNSTILE_SCRIPT_SRC) {
    throw new TypeError(
      `${TURNSTILE_TT_POLICY_NAME}: refusing script URL outside the Turnstile allowlist: ${input}`,
    );
  }
  return input;
}

/** Create the policy, or return null when Trusted Types is unavailable. */
export function createTurnstileScriptUrlPolicy(
  factory: TrustedTypesFactoryLike | undefined,
): ScriptUrlPolicy | null {
  if (typeof factory?.createPolicy !== 'function') {
    return null;
  }
  return factory.createPolicy(TURNSTILE_TT_POLICY_NAME, {
    createScriptURL: allowTurnstileScriptUrlOnly,
  });
}

// Created once per page: with a `trusted-types` directive that omits
// 'allow-duplicates', a second createPolicy() with the same name throws.
let cachedPolicy: ScriptUrlPolicy | null | undefined;

/** The value to assign to `script.src` for the Turnstile loader. */
export function turnstileScriptUrl(): TrustedScriptURLLike | string {
  if (cachedPolicy === undefined) {
    const factory = (globalThis as { trustedTypes?: TrustedTypesFactoryLike }).trustedTypes;
    cachedPolicy = createTurnstileScriptUrlPolicy(factory);
  }
  return cachedPolicy ? cachedPolicy.createScriptURL(TURNSTILE_SCRIPT_SRC) : TURNSTILE_SCRIPT_SRC;
}
