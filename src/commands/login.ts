/**
 * Token management commands
 *
 * The new Public API uses AccessToken authentication.
 * Tokens are created at https://kronan.is/adgangur/adgangslyklar
 */

import { getMe } from "../api.ts";
import { clearToken, loadToken, saveToken } from "../auth.ts";

export async function tokenCommand(tokenValue: string): Promise<void> {
  // First validate the token before saving
  const token = { token: tokenValue };

  try {
    const me = await getMe(token);
    // Token is valid, save it
    await saveToken(tokenValue);
    console.log("Token saved successfully!");
    console.log("");
    console.log(`  Identity: ${me.name}`);
    console.log(`  Type:     ${me.type}`);
  } catch (error: any) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
}

export async function logoutCommand(): Promise<void> {
  await clearToken();
  console.log("Token cleared.");
}

export async function statusCommand(): Promise<void> {
  const token = await loadToken();
  if (!token) {
    console.log(JSON.stringify({ loggedIn: false }, null, 2));
    return;
  }

  try {
    const me = await getMe(token);
    console.log(
      JSON.stringify(
        {
          loggedIn: true,
          name: me.name,
          type: me.type,
        },
        null,
        2,
      ),
    );
  } catch (error: any) {
    console.log(
      JSON.stringify(
        {
          loggedIn: false,
          error: error.message,
        },
        null,
        2,
      ),
    );
  }
}
