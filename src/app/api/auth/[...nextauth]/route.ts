import NextAuth, { NextAuthOptions, Session } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";

const KEYCLOAK_CLIENT_ID = "appdemo";
const KEYCLOAK_CLIENT_SECRET = "HM15Xe6OLhMBUFfM0hn0hHGHfipoBmXe";
const KEYCLOAK_URL = "http://localhost:8080";
const KEYCLOAK_REALM = "demo";

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

const authOptions: NextAuthOptions = {
  providers, callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.decoded = jwtDecode(account.access_token as string);
        token.access_token = account.access_token;
        token.id_token = account.id_token;
        token.expires_at = account.expires_at;
        token.refresh_token = account.refresh_token;
      }
      console.log(account)
      return token
    },
    async session({ session, token }) {
      session.access_token = token.access_token as string; // see utils/sessionTokenAccessor.js
      session.refresh_token = token.access_token as string; // see utils/sessionTokenAccessor.js
      session.id_token = token.id_token as string;  // see utils/sessionTokenAccessor.js
      session.roles = (token.decoded as any).realm_access.roles as string[];
      session.error = token.error as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };