/**
 * Login command - authenticates via Rafræn skilríki
 */

import { clearTokens, initiateAuth, loadTokens, pollAuth } from "../auth.ts";

export async function loginCommand(phoneNumber: string): Promise<void> {
  console.log(`Initiating login for phone number: ${phoneNumber}`);

  const { code, session } = await initiateAuth(phoneNumber);

  console.log("");
  console.log(`  Confirm code on your phone: ${code}`);
  console.log("  Waiting for approval...");
  console.log("");

  const tokens = await pollAuth(phoneNumber, session, (status, attempt) => {
    process.stdout.write(`\r  Status: ${status} (attempt ${attempt})   `);
  });

  console.log("\r  Login successful!                        ");
  console.log("");

  // Decode IdToken to get user name
  try {
    const payload = JSON.parse(
      Buffer.from(tokens.idToken.split(".")[1]!, "base64").toString(),
    );
    console.log(`  Welcome, ${payload.name}`);
  } catch {}
}

export async function logoutCommand(): Promise<void> {
  await clearTokens();
  console.log("Logged out. Tokens cleared.");
}

export async function statusCommand(): Promise<void> {
  const tokens = await loadTokens();
  if (!tokens) {
    console.log(JSON.stringify({ loggedIn: false }));
    return;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(tokens.idToken.split(".")[1]!, "base64").toString(),
    );
    console.log(
      JSON.stringify(
        {
          loggedIn: true,
          username: payload["cognito:username"],
          name: payload.name,
          expiresAt: new Date(tokens.expiresAt).toISOString(),
        },
        null,
        2,
      ),
    );
  } catch {
    console.log(JSON.stringify({ loggedIn: true }));
  }
}
