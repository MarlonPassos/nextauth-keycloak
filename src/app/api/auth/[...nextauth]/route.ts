import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import { encrypt } from '../../../../utils/encryption';
import { JWT } from "next-auth/jwt";

const KEYCLOAK_CLIENT_ID = "appdemo";
const KEYCLOAK_CLIENT_SECRET = "HM15Xe6OLhMBUFfM0hn0hHGHfipoBmXe";
const KEYCLOAK_URL = "http://localhost:8080";
const KEYCLOAK_REALM = "demo";
const REFRESH_TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

const KEYCLOAK_ISSUER = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`

const keycloakConfig = {
  clientId: KEYCLOAK_CLIENT_ID,
  clientSecret: KEYCLOAK_CLIENT_SECRET,
  issuer: KEYCLOAK_ISSUER,
} as const;

const providers = [
  // Configure Keycloak as the authentication provider
  KeycloakProvider(keycloakConfig),
];

async function refreshAccessToken(token: JWT) {
  const resp = await fetch(`${REFRESH_TOKEN_URL}`, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: KEYCLOAK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token as unknown as string,
    }),
    method: "POST",
  });
  const refreshToken = await resp.json();
  if (!resp.ok) throw refreshToken;

  return {
    ...token,
    access_token: refreshToken.access_token,
    decoded: jwtDecode(refreshToken.access_token),
    id_token: refreshToken.id_token,
    expires_at: Math.floor(Date.now() / 1000) + refreshToken.expires_in,
    refresh_token: refreshToken.refresh_token,
  };
}


export const authOptions: NextAuthOptions = {
  providers, callbacks: {
    async jwt({ token, account }) {
      const nowTimeStamp = Math.floor(Date.now() / 1000);
      const expires_at = token?.expires_at as number;
      console.log(`expires: ${expires_at} | ${nowTimeStamp}`)
      if (account) {
        token.decoded = jwtDecode(account.access_token as string);
        token.access_token = account.access_token;
        token.id_token = account.id_token;
        token.expires_at = account.expires_at as number;
        token.refresh_token = account.refresh_token;
        return token;
      } else if (nowTimeStamp < expires_at) {
        return token;
      } else {
        console.log("Token has expired. Will refresh...")
        try {
          const refreshedToken = await refreshAccessToken(token);
          console.log("Token is refreshed.")
          return refreshedToken;
        } catch (error) {
          console.error("Error refreshing access token", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
    },
    async session({ session, token }) {
      session.access_token = encrypt(token.access_token as string);
      session.refresh_token = encrypt(token.access_token as string);
      // session.id_token = token.id_token as string;
      session.roles = (token.decoded as any).realm_access.roles as string[];
      session.error = token.error as string;
      return session;
    },

  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };