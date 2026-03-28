/**
 * Krónan Authentication Module
 *
 * Handles AWS Cognito custom auth flow using Rafræn skilríki (Icelandic electronic ID).
 * Stores tokens in ~/.kronan/tokens.json for persistence between CLI invocations.
 */

import { join } from "path";
import { homedir } from "os";

// Cognito configuration
const COGNITO_ENDPOINT = "https://cognito-idp.eu-west-1.amazonaws.com/";
// Public Cognito app client ID — this is NOT a secret. It's embedded in
// the Kronan.is frontend and is required for the CUSTOM_AUTH flow.
const CLIENT_ID = "26cfceo8iffeoulsfnkopgfnbv";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

// Token storage path
const TOKEN_DIR = join(homedir(), ".kronan");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // unix timestamp in ms
}

interface CognitoInitResponse {
  ChallengeName: string;
  ChallengeParameters: {
    USERNAME: string;
    code: string;
    status: string;
  };
  Session: string;
}

interface CognitoAuthResult {
  AuthenticationResult: {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
  };
}

interface CognitoChallengeResponse {
  ChallengeName?: string;
  ChallengeParameters?: {
    USERNAME: string;
    code?: string;
    status: string;
  };
  Session?: string;
  AuthenticationResult?: CognitoAuthResult["AuthenticationResult"];
}

async function cognitoRequest(target: string, payload: object): Promise<any> {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as Record<string, any>;

  if (data.__type) {
    throw new Error(`Cognito error: ${data.__type} - ${data.message || ""}`);
  }

  return data;
}

/**
 * Initiate a login flow with Rafræn skilríki.
 * Returns a code the user must confirm on their phone.
 */
export async function initiateAuth(phoneNumber: string): Promise<{
  code: string;
  session: string;
}> {
  const data: CognitoInitResponse = await cognitoRequest("InitiateAuth", {
    AuthFlow: "CUSTOM_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: phoneNumber,
    },
  });

  return {
    code: data.ChallengeParameters.code,
    session: data.Session,
  };
}

/**
 * Poll for auth completion after user approves on their phone.
 * Calls the provided callback with status updates.
 */
export async function pollAuth(
  phoneNumber: string,
  session: string,
  onStatus?: (status: string, attempt: number) => void
): Promise<AuthTokens> {
  let currentSession = session;

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const data: CognitoChallengeResponse = await cognitoRequest(
      "RespondToAuthChallenge",
      {
        ChallengeName: "CUSTOM_CHALLENGE",
        ClientId: CLIENT_ID,
        ChallengeResponses: {
          USERNAME: phoneNumber,
          ANSWER: "answer",
        },
        Session: currentSession,
      }
    );

    // Check for successful auth
    if (data.AuthenticationResult) {
      const tokens: AuthTokens = {
        accessToken: data.AuthenticationResult.AccessToken,
        idToken: data.AuthenticationResult.IdToken,
        refreshToken: data.AuthenticationResult.RefreshToken,
        expiresAt:
          Date.now() + data.AuthenticationResult.ExpiresIn * 1000,
      };

      await saveTokens(tokens);
      return tokens;
    }

    const status = data.ChallengeParameters?.status || "unknown";
    onStatus?.(status, attempt);

    if (data.Session) {
      currentSession = data.Session;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Authentication timed out. Please try again.");
}

/**
 * Refresh tokens using the refresh token.
 */
export async function refreshAuth(refreshToken: string): Promise<AuthTokens> {
  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  if (!data.AuthenticationResult) {
    throw new Error("Token refresh failed");
  }

  const tokens: AuthTokens = {
    accessToken: data.AuthenticationResult.AccessToken,
    idToken: data.AuthenticationResult.IdToken,
    refreshToken: refreshToken, // refresh token stays the same
    expiresAt: Date.now() + data.AuthenticationResult.ExpiresIn * 1000,
  };

  await saveTokens(tokens);
  return tokens;
}

/**
 * Save tokens to disk.
 */
async function saveTokens(tokens: AuthTokens): Promise<void> {
  const { mkdir } = await import("fs/promises");
  await mkdir(TOKEN_DIR, { recursive: true });
  await Bun.write(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

/**
 * Load tokens from disk, refreshing if expired.
 * Returns null if no tokens are stored.
 */
export async function loadTokens(): Promise<AuthTokens | null> {
  const file = Bun.file(TOKEN_FILE);

  if (!(await file.exists())) {
    return null;
  }

  try {
    const tokens: AuthTokens = await file.json();

    // Check if tokens are expired (with 5 min buffer)
    if (Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
      try {
        return await refreshAuth(tokens.refreshToken);
      } catch {
        // Refresh failed, tokens are invalid
        return null;
      }
    }

    return tokens;
  } catch {
    return null;
  }
}

/**
 * Ensure we have valid tokens, prompting login if needed.
 * Throws if no tokens available.
 */
export async function requireAuth(): Promise<AuthTokens> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "Not logged in. Run 'kronan login' first."
    );
  }
  return tokens;
}

/**
 * Clear stored tokens (logout).
 */
export async function clearTokens(): Promise<void> {
  const file = Bun.file(TOKEN_FILE);
  if (await file.exists()) {
    const { unlink } = await import("fs/promises");
    await unlink(TOKEN_FILE);
  }
}
