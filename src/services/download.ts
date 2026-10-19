import { fetch as expoFetch } from "expo/fetch";
import { Directory, File, FileMode, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { resolveTranscodingUrl } from "./soundcloud";
import { MAX_STORED_DOWNLOADS } from "@/src/constants/soundcloud";
import { AudioFormat, DownloadedFile, Episode, Track, Transcoding } from "@/src/interfaces/episode";
import { abortError, AppError, isAbortError } from "@/src/utils/error";
import { AUDIO_FORMATS, parsePlaylist, sniffFormat } from "@/src/utils/hls";
import { createMp4Remuxer } from "@/src/utils/mp4";
import { request } from "@/src/utils/request";

const SEGMENT_CONCURRENCY = 4;

interface DownloadOptions {
  onProgress: (progress: number) => void;
  signal: AbortSignal;
}

function getDownloadsDir() {
  const dir = new Directory(Paths.document, "episodios");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const getBaseName = (episode: Episode) => `Manha de Luz ${episode.dateKey ?? episode.id}`.replace(/[^a-zA-Z0-9 _-]/g, "");

function safeDelete(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // arquivo temporário; não vale derrubar o fluxo por isso
  }
}

// Ordem de preferência: MP3 direto > HLS em MP3 > HLS em AAC. Opus/OGG não
// funciona bem ao juntar segmentos, e trechos "snipped" são só prévias.
function rankTranscodings(track: Track) {
  const getScore = ({ format = {}, snipped }: Transcoding) => {
    const { protocol, mime_type: mime = "" } = format;

    if (snipped || mime.includes("ogg")) return 0;
    if (protocol === "progressive") return 100;
    if (protocol !== "hls") return 0;
    if (mime.startsWith("audio/mpeg") && mime !== "audio/mpegurl") return 90;
    if (mime.startsWith("audio/mp4")) return 80;
    if (mime === "audio/mpegurl") return 70;
    return 10;
  };

  const transcodings = (track.media?.transcodings ?? []).filter((transcoding) => typeof transcoding?.url === "string");

  return transcodings
    .map((transcoding) => ({ transcoding, score: getScore(transcoding) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ transcoding }) => transcoding);
}

export function findDownloaded(episode: Episode): DownloadedFile | null {
  if (Platform.OS === "web") return null;

  try {
    const dir = getDownloadsDir();

    for (const format of Object.values(AUDIO_FORMATS)) {
      const file = new File(dir, `${getBaseName(episode)}.${format.extension}`);
      if (file.exists && file.size > 0) return { uri: file.uri, ...format };
    }
  } catch {
    // sem acesso ao armazenamento: trata como não baixado
  }

  return null;
}

async function downloadHls(url: string, partFile: File, { onProgress, signal }: DownloadOptions) {
  const fetchBytes = (segmentUrl: string) => request(segmentUrl, { as: "bytes", signal, retries: 3, timeout: 30000, fetchImpl: expoFetch as typeof fetch });

  let playlist = parsePlaylist(await request(url, { as: "text", signal }), url);
  if (playlist.type === "master") {
    const variantUrl = playlist.variants[0].url;
    playlist = parsePlaylist(await request(variantUrl, { as: "text", signal }), variantUrl);
  }

  if (playlist.type !== "media" || !playlist.segments.length) {
    throw new AppError("NO_STREAM", "O áudio deste episódio está vazio.");
  }
  if (playlist.encrypted || playlist.byteRange) {
    throw new AppError("PROTECTED", "Este episódio está protegido e não pode ser baixado.");
  }

  const { segments, initUrl } = playlist;
  // AAC em MP4 fragmentado é convertido para um .m4a comum durante o download.
  const remuxer = initUrl ? createMp4Remuxer(await fetchBytes(initUrl)) : null;
  let format: AudioFormat | null = remuxer && AUDIO_FORMATS.m4a;

  partFile.create({ overwrite: true, intermediates: true });
  if (remuxer) await partFile.write(remuxer.header);

  // Baixa em lotes paralelos, mas grava sempre na ordem dos segmentos.
  for (let start = 0; start < segments.length; start += SEGMENT_CONCURRENCY) {
    if (signal.aborted) throw abortError();

    const chunks = await Promise.all(segments.slice(start, start + SEGMENT_CONCURRENCY).map(fetchBytes));
    for (const chunk of chunks) {
      format ??= sniffFormat(chunk);
      for (const data of remuxer ? remuxer.addSegment(chunk) : [chunk]) {
        await partFile.write(data, { append: true });
      }
    }

    onProgress(Math.min(start + SEGMENT_CONCURRENCY, segments.length) / segments.length);
  }

  if (remuxer) {
    const moov = remuxer.finish();
    const handle = partFile.open(FileMode.ReadWrite);
    try {
      handle.offset = remuxer.mdatSizeOffset;
      handle.writeBytesSync(remuxer.getMdatSizeBytes());
    } finally {
      handle.close();
    }
    await partFile.write(moov, { append: true });
  }

  return format ?? AUDIO_FORMATS.mp3;
}

/**
 * Baixa o episódio para o armazenamento do app. Grava primeiro num arquivo
 * ".part" e só renomeia quando termina, para nunca deixar um áudio pela
 * metade como se estivesse completo.
 */
export async function downloadEpisode(episode: Episode, options: DownloadOptions): Promise<DownloadedFile> {
  const { onProgress, signal } = options;

  if (Platform.OS === "web") {
    throw new AppError("UNSUPPORTED", "O download só funciona no aplicativo de celular.");
  }

  const existing = findDownloaded(episode);
  if (existing) return existing;

  const transcodings = rankTranscodings(episode.track);
  if (!transcodings.length) {
    throw new AppError("NO_STREAM", "Este episódio não tem um áudio disponível para download.");
  }

  const dir = getDownloadsDir();
  const partFile = new File(dir, `${getBaseName(episode)}.part`);
  let lastError: unknown;

  // Se um formato falhar, tenta o próximo da lista.
  for (const transcoding of transcodings) {
    try {
      onProgress(0);
      const url = await resolveTranscodingUrl(episode.track, transcoding, signal);

      let format = AUDIO_FORMATS.mp3;
      if (transcoding.format?.protocol === "progressive") {
        await File.downloadFileAsync(url, partFile, {
          idempotent: true,
          signal,
          onProgress: ({ bytesWritten, totalBytes }) => totalBytes > 0 && onProgress(bytesWritten / totalBytes),
        });
      } else {
        format = await downloadHls(url, partFile, options);
      }

      if (signal.aborted) throw abortError();
      if (!partFile.exists || partFile.size === 0) {
        throw new AppError("EMPTY_FILE", "O download terminou, mas o arquivo veio vazio.");
      }

      const finalFile = new File(dir, `${getBaseName(episode)}.${format.extension}`);
      safeDelete(finalFile);
      partFile.move(finalFile);

      // Mantém só os downloads mais recentes para não lotar o aparelho.
      try {
        dir.list()
          .filter((item): item is File => item instanceof File)
          .sort((a, b) => (b.modificationTime ?? 0) - (a.modificationTime ?? 0))
          .slice(MAX_STORED_DOWNLOADS)
          .forEach(safeDelete);
      } catch {
        // limpeza é opcional
      }

      return { uri: finalFile.uri, ...format };
    } catch (error) {
      safeDelete(partFile);
      if (isAbortError(error) || signal.aborted) throw abortError();
      lastError = error;
    }
  }

  if (lastError instanceof AppError) throw lastError;
  throw new AppError("DOWNLOAD_FAILED", "Não foi possível baixar o áudio. Tente novamente.", { cause: lastError, retryable: true });
}
