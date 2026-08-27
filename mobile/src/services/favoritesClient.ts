import Config from 'react-native-config';
import { getFreshIdToken } from './firebaseAuth';

const BASE_URL = Config.OTA_SERVER_URL ?? 'http://10.0.2.2:3000';

export interface ServerFavorite {
  id: string;
  userId: string;
  quoteId: string;
  createdAt: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFreshIdToken();
  if (!token) {
    throw new Error('Not signed in.');
  }
  return { Authorization: `Bearer ${token}` };
}

/** GET /favorites — list the signed-in user's favorited quotes. */
export async function fetchFavorites(): Promise<ServerFavorite[]> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/favorites`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch favorites: HTTP ${res.status}`);
  }
  return res.json() as Promise<ServerFavorite[]>;
}

/** POST /favorites/:quoteId — add a quote to the signed-in user's favorites. */
export async function addFavoriteRemote(
  quoteId: string,
): Promise<ServerFavorite> {
  const headers = await authHeaders();
  const res = await fetch(
    `${BASE_URL}/favorites/${encodeURIComponent(quoteId)}`,
    { method: 'POST', headers },
  );
  if (!res.ok) {
    throw new Error(`Failed to add favorite: HTTP ${res.status}`);
  }
  return res.json() as Promise<ServerFavorite>;
}

/** DELETE /favorites/:quoteId — remove a quote from the signed-in user's favorites. */
export async function removeFavoriteRemote(quoteId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(
    `${BASE_URL}/favorites/${encodeURIComponent(quoteId)}`,
    { method: 'DELETE', headers },
  );
  if (!res.ok) {
    throw new Error(`Failed to remove favorite: HTTP ${res.status}`);
  }
}
