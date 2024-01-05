import { getAccessToken } from '@/utils/sessionTokenAccessor';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { SetDynamicRoute } from '@/utils/setDynamicRoute';
import { useEffect } from 'react';
import AuthStatus from '@/components/authStatus';

async function getSnippets() {
  const url = `http://127.0.0.1:8000/snippets/`;

  let accessToken = await getAccessToken();

  const resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });
  console.log(resp.status)
  if (resp.ok) {
    const data = await resp.json();
    return { data, status: resp.status };
  }

  throw new Error("Failed to fetch data. Status: " + resp.status);
}



export default async function Home() {
  const session = await getServerSession(authOptions);
  // console.log(session)

  if (session && session.roles?.includes("judge")) {
    try {
      const snippets = await getSnippets();

      return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <SetDynamicRoute></SetDynamicRoute>
          <h1>Next Auth - Keycloak</h1>
          <br />
          <AuthStatus />
          <code>
            {
              JSON.stringify(snippets)
            }
          </code>

        </main>
      )
    } catch (e) {
      console.error(e);

      return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <h1>Next Auth - Keycloak</h1>
          <h2>Sorry, an error happened. Check the server logs.</h2>
          <AuthStatus />
        </main>
      )
    }
  }
}
