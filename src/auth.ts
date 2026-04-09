/**
 * Krónan Public API Authentication Module
 *
 * The new Public API uses AccessToken authentication.
 * Tokens are created at https://kronan.is/adgangur/adgangslyklar
 * and must be provided by the user.
 *
 * Stores tokens in ~/.kronan/token for persistence between CLI invocations.
 */

import { homedir } from "node:os";
import { join } from "node:path";

// Token storage path
const TOKEN_DIR = join(homedir(), ".kronan");
const TOKEN_FILE = join(TOKEN_DIR, "token");

export interface AuthToken {
  token: string;
}

/**
 * Save access token to disk.
 */
export async function saveToken(token: string): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(TOKEN_DIR, { recursive: true });
  await Bun.write(TOKEN_FILE, token);
}

/**
 * Load access token from disk.
 * Returns null if no token is stored.
 */
export async function loadToken(): Promise<AuthToken | null> {
  const file = Bun.file(TOKEN_FILE);

  if (!(await file.exists())) {
    return null;
  }

  try {
    const token = await file.text();
    return { token: token.trim() };
  } catch {
    return null;
  }
}

/**
 * Ensure we have a valid token.
 * Throws if no token available.
 */
export async function requireAuth(): Promise<AuthToken> {
  const token = await loadToken();
  if (!token) {
    throw new Error(
      "No access token found. Create one at https://kronan.is/adgangur/adgangslyklar and run 'kronan token <your-token>'",
    );
  }
  return token;
}

/**
 * Clear stored token (logout).
 */
export async function clearToken(): Promise<void> {
  const file = Bun.file(TOKEN_FILE);
  if (await file.exists()) {
    const { unlink } = await import("node:fs/promises");
    await unlink(TOKEN_FILE);
  }
}

/**
 * Get auth header value for API requests.
 */
export function getAuthHeader(token: AuthToken): string {
  return `AccessToken ${token.token}`;
}
