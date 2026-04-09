/**
 * Token management commands
 *
 * The new Public API uses AccessToken authentication.
 * Tokens are created at https://kronan.is/adgangur/adgangslyklar
 */

import { getMe } from "../api.ts";
import {
  clearToken,
  loadProfiles,
  loadToken,
  removeProfile,
  saveProfile,
  saveToken,
  setActiveProfile,
} from "../auth.ts";

export async function tokenCommand(
  tokenValue: string,
  options: { name?: string } = {},
): Promise<void> {
  // Validate the token before saving
  const token = { token: tokenValue };

  try {
    const me = await getMe(token);
    const profileName = options.name || me.name;

    // Save to profiles and legacy token file
    await saveProfile(profileName, tokenValue);
    await saveToken(tokenValue);

    console.log("Token saved successfully!");
    console.log("");
    console.log(`  Profile:  ${profileName}`);
    console.log(`  Identity: ${me.name}`);
    console.log(`  Type:     ${me.type}`);
  } catch (error: any) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
}

export async function profilesCommand(): Promise<void> {
  const profiles = await loadProfiles();
  const names = Object.keys(profiles.profiles);

  if (names.length === 0) {
    console.log("No profiles saved. Use 'kronan token <token>' to add one.");
    return;
  }

  console.log("Profiles:\n");
  for (const name of names) {
    const active = profiles.active === name ? " (active)" : "";
    console.log(`  ${name}${active}`);
  }
  console.log("\nUse 'kronan profile <name>' to switch profiles.");
}

export async function profileSwitchCommand(name: string): Promise<void> {
  await setActiveProfile(name);
  console.log(`Switched to profile "${name}".`);
}

export async function profileRemoveCommand(name: string): Promise<void> {
  const profiles = await loadProfiles();
  if (!profiles.profiles[name]) {
    console.error(
      `Profile "${name}" not found. Use 'kronan profiles' to see available profiles.`,
    );
    process.exit(1);
  }
  await removeProfile(name);
  console.log(`Removed profile "${name}".`);
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
