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
const PROFILES_FILE = join(TOKEN_DIR, "profiles.json");

export interface AuthToken {
  token: string;
}

export interface Profiles {
  active?: string;
  profiles: Record<string, string>;
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

// --- Profile Management ---

/**
 * Load profiles from disk.
 */
export async function loadProfiles(): Promise<Profiles> {
  const file = Bun.file(PROFILES_FILE);

  if (!(await file.exists())) {
    return { profiles: {} };
  }

  try {
    return await file.json();
  } catch {
    return { profiles: {} };
  }
}

/**
 * Save profiles to disk.
 */
export async function saveProfiles(profiles: Profiles): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(TOKEN_DIR, { recursive: true });
  await Bun.write(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

/**
 * Save a named profile.
 */
export async function saveProfile(
  name: string,
  tokenValue: string,
): Promise<void> {
  const profiles = await loadProfiles();
  profiles.profiles[name] = tokenValue;
  // If this is the first profile, make it active
  if (!profiles.active) {
    profiles.active = name;
  }
  await saveProfiles(profiles);
}

/**
 * Remove a named profile.
 */
export async function removeProfile(name: string): Promise<void> {
  const profiles = await loadProfiles();
  delete profiles.profiles[name];
  if (profiles.active === name) {
    const remaining = Object.keys(profiles.profiles);
    profiles.active = remaining.length > 0 ? remaining[0] : undefined;
  }
  await saveProfiles(profiles);
}

/**
 * Set the active profile.
 */
export async function setActiveProfile(name: string): Promise<void> {
  const profiles = await loadProfiles();
  if (!profiles.profiles[name]) {
    throw new Error(
      `Profile "${name}" not found. Use 'kronan profiles' to see available profiles.`,
    );
  }
  profiles.active = name;
  await saveProfiles(profiles);
  // Also write to the legacy token file for backward compat
  await saveToken(profiles.profiles[name]!);
}

/**
 * Ensure we have a valid token.
 * Priority: active profile > legacy token file.
 */
export async function requireAuth(): Promise<AuthToken> {
  // Check profiles first
  const profiles = await loadProfiles();
  if (profiles.active && profiles.profiles[profiles.active]) {
    return { token: profiles.profiles[profiles.active]! };
  }
  // Fall back to legacy token file
  const token = await loadToken();
  if (!token) {
    throw new Error(
      "No access token found. Create one at https://kronan.is/adgangur/adgangslyklar and run 'kronan token <your-token>'",
    );
  }
  return token;
}
