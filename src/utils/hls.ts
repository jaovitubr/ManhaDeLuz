import { AudioFormat } from "@/src/interfaces/episode";

// Leitura mínima de playlists HLS (m3u8) e identificação do formato do áudio.
// O SoundCloud deixou de oferecer MP3 direto ("progressive"); hoje os áudios
// só chegam em HLS, então o arquivo é montado juntando os segmentos.

export type Playlist =
  | { type: "master"; variants: { url: string; bandwidth: number }[] }
  | { type: "media"; segments: string[]; initUrl: string | null; encrypted: boolean; byteRange: boolean };

export const AUDIO_FORMATS: Record<AudioFormat["extension"], AudioFormat> = {
  mp3: { extension: "mp3", mimeType: "audio/mpeg", uti: "public.mp3" },
  m4a: { extension: "m4a", mimeType: "audio/mp4", uti: "public.mpeg-4-audio" },
  aac: { extension: "aac", mimeType: "audio/aac", uti: "public.aac-audio" },
  ts: { extension: "ts", mimeType: "video/mp2t", uti: "public.mpeg-2-transport-stream" },
};

export function resolveUrl(base: string, relative: string) {
  if (/^https?:\/\//i.test(relative)) return relative;
  if (relative.startsWith("//")) return `${base.split(":")[0]}:${relative}`;
  if (relative.startsWith("/")) return (base.match(/^https?:\/\/[^/?#]+/i)?.[0] ?? "") + relative;

  const path = base.split(/[?#]/)[0];
  return path.slice(0, path.lastIndexOf("/") + 1) + relative;
}

const parseAttributes = (text: string) => Object.fromEntries(
  Array.from(text.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g), ([, key, value]) => [key, value.replace(/^"|"$/g, "")])
);

export function parsePlaylist(text: string, baseUrl: string): Playlist {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines[0] !== "#EXTM3U") throw new Error("Playlist HLS inválida");

  const variants: { url: string; bandwidth: number }[] = [];
  const segments: string[] = [];
  let initUrl: string | null = null;
  let encrypted = false;
  let byteRange = false;
  let pendingVariant: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      pendingVariant = parseAttributes(line.slice(18));
    } else if (line.startsWith("#EXT-X-MAP:")) {
      const { URI } = parseAttributes(line.slice(11));
      if (URI) initUrl = resolveUrl(baseUrl, URI);
    } else if (line.startsWith("#EXT-X-KEY:")) {
      const { METHOD } = parseAttributes(line.slice(11));
      if (METHOD && METHOD !== "NONE") encrypted = true;
    } else if (line.startsWith("#EXT-X-BYTERANGE")) {
      byteRange = true;
    } else if (!line.startsWith("#")) {
      if (pendingVariant) {
        variants.push({ url: resolveUrl(baseUrl, line), bandwidth: Number(pendingVariant.BANDWIDTH) || 0 });
        pendingVariant = null;
      } else {
        segments.push(resolveUrl(baseUrl, line));
      }
    }
  }

  if (variants.length) return { type: "master", variants: variants.sort((a, b) => b.bandwidth - a.bandwidth) };
  return { type: "media", segments, initUrl, encrypted, byteRange };
}

// Descobre o formato pelos primeiros bytes do primeiro segmento.
export function sniffFormat(bytes: Uint8Array): AudioFormat {
  if (bytes.length < 4) return AUDIO_FORMATS.mp3;

  // Pula a tag ID3v2, se houver (tamanho em "syncsafe integer").
  const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33 && bytes.length >= 10;
  const offset = hasId3 ? 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]) : 0;

  if (bytes[offset] === 0x47) return AUDIO_FORMATS.ts;
  if (bytes[offset + 4] === 0x66 && bytes[offset + 5] === 0x74 && bytes[offset + 6] === 0x79) return AUDIO_FORMATS.m4a; // "ftyp"
  if (bytes[offset] === 0xff && (bytes[offset + 1] & 0xf6) === 0xf0) return AUDIO_FORMATS.aac; // ADTS
  return AUDIO_FORMATS.mp3;
}
