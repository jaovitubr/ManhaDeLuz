import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BROWSER_HEADERS,
  CLIENT_ID_STORAGE_KEY,
  SOUNDCLOUD_API_URL,
  SOUNDCLOUD_USER_ID,
  TRACKS_PAGE_SIZE,
} from "@/src/constants/soundcloud";
import { Track, Transcoding } from "@/src/interfaces/episode";
import { AppError, isAbortError } from "@/src/utils/error";
import { request, withQuery } from "@/src/utils/request";

// O SoundCloud não tem API pública aberta: o client ID usado pelo site fica
// embutido nos bundles JS da página inicial. Ele muda de tempos em tempos,
// então guardamos o último válido e buscamos outro quando ele expira.
let cachedClientId: string | null = null;
let discoveryPromise: Promise<string> | null = null;

export function extractScriptUrls(html: string) {
  const urls = Array.from(html.matchAll(/<script[^>]+src="([^"]+\.js)"/g), ([, url]) => url.startsWith("//") ? `https:${url}` : url)
    .filter((url, index, all) => url.startsWith("https://") && all.indexOf(url) === index);

  // O client ID costuma estar nos últimos bundles do próprio SoundCloud (sndcdn).
  return [
    ...urls.filter((url) => url.includes("sndcdn.com")).reverse(),
    ...urls.filter((url) => !url.includes("sndcdn.com")),
  ];
}

export function extractClientIds(source: string) {
  const matches = [
    ...source.matchAll(/client_id\s*[:=]\s*"([a-zA-Z0-9]{32})"/g),
    ...source.matchAll(/client_id=([a-zA-Z0-9]{32})\b/g),
  ];

  return [...new Set(matches.map(([, id]) => id))];
}

async function discoverClientId(signal?: AbortSignal) {
  const html = await request("https://soundcloud.com", { as: "text", headers: BROWSER_HEADERS, signal });

  for (const url of extractScriptUrls(html)) {
    const source = await request(url, { as: "text", headers: BROWSER_HEADERS, signal, retries: 1 }).catch((error) => {
      if (isAbortError(error)) throw error;
      return "";
    });

    for (const clientId of extractClientIds(source)) {
      const isValid = await request(withQuery(`${SOUNDCLOUD_API_URL}/users/${SOUNDCLOUD_USER_ID}`, { client_id: clientId }), { signal, retries: 1 })
        .then(() => true)
        .catch((error) => {
          if (error.code === "UNAUTHORIZED") return false;
          throw error;
        });

      if (isValid) return clientId;
    }
  }

  throw new AppError("CLIENT_ID", "Não foi possível conectar ao SoundCloud. Tente novamente mais tarde.", { retryable: true });
}

async function getClientId(signal?: AbortSignal) {
  cachedClientId ??= await AsyncStorage.getItem(CLIENT_ID_STORAGE_KEY).catch(() => null);
  if (cachedClientId) return cachedClientId;

  // Evita várias buscas simultâneas do client ID.
  discoveryPromise ??= discoverClientId(signal).finally(() => discoveryPromise = null);
  cachedClientId = await discoveryPromise;
  await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, cachedClientId).catch(() => {});

  return cachedClientId;
}

// Executa a chamada com o client ID atual; se ele tiver expirado, descarta,
// busca um novo e tenta mais uma vez.
async function withClientId<T>(signal: AbortSignal | undefined, call: (clientId: string) => Promise<T>) {
  const clientId = await getClientId(signal);

  try {
    return await call(clientId);
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== "UNAUTHORIZED") throw error;

    cachedClientId = null;
    await AsyncStorage.removeItem(CLIENT_ID_STORAGE_KEY).catch(() => {});
    return call(await getClientId(signal));
  }
}

export async function fetchTracks(signal?: AbortSignal): Promise<Track[]> {
  const data = await withClientId(signal, (clientId) => request(
    withQuery(`${SOUNDCLOUD_API_URL}/users/${SOUNDCLOUD_USER_ID}/tracks`, { client_id: clientId, limit: TRACKS_PAGE_SIZE }),
    { signal }
  ));

  if (!Array.isArray(data?.collection)) {
    throw new AppError("INVALID_RESPONSE", "O SoundCloud respondeu em um formato inesperado.");
  }

  return data.collection;
}

// Troca a URL de um "transcoding" pela URL real do áudio/playlist.
export async function resolveTranscodingUrl(track: Track, transcoding: Transcoding, signal?: AbortSignal) {
  const data = await withClientId(signal, (clientId) => request(
    withQuery(transcoding.url, { client_id: clientId, track_authorization: track.track_authorization }),
    { signal }
  ));

  if (typeof data?.url !== "string" || !data.url.startsWith("http")) {
    throw new AppError("NO_STREAM", "Não foi possível obter o endereço do áudio.");
  }

  return data.url as string;
}
