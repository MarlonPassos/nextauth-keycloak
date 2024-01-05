import "next-auth";

declare module "next-auth" {
  interface User {
    id: number;
  }

  interface Session {
    access_token: string
    id_token: string
    roles: string[]
    error: string
    refresh_token: string
  }
}

