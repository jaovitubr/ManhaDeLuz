import { formatDateKey, makeDate, startOfDay } from "./format";
import { PROGRAM_TITLE_REGEX } from "@/src/constants/soundcloud";
import { Episode, Track } from "@/src/interfaces/episode";

// "Manhã de Luz – 19/10/2026" -> 19/10/2026 (aceita / . - e ano com 2 dígitos)
export function parseTitleDate(title: string) {
  const match = title.match(/(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4})/);
  if (!match) return null;

  const year = Number(match[3]);
  return makeDate(year < 100 ? year + 2000 : year, Number(match[2]), Number(match[1]));
}

export function toEpisode(track: Track): Episode {
  // O display_date é agendado para 02:00 UTC do dia do programa, o que no Brasil
  // ainda é o dia anterior. Por isso a data do título vem primeiro e, na falta
  // dela, usamos a data UTC do agendamento.
  const scheduled = new Date(track.display_date || track.release_date || track.created_at || NaN);
  const date = parseTitleDate(track.title) ?? (
    Number.isNaN(scheduled.getTime()) ?
      null :
      makeDate(scheduled.getUTCFullYear(), scheduled.getUTCMonth() + 1, scheduled.getUTCDate())
  );
  const artworkUrl = track.artwork_url || track.user?.avatar_url;

  return {
    id: String(track.id),
    title: track.title.trim(),
    date,
    dateKey: date && formatDateKey(date),
    // "-large" tem só 100x100; "-t500x500" fica nítido em telas de alta densidade.
    artworkUrl: artworkUrl ? artworkUrl.replace("-large.", "-t500x500.") : null,
    durationMs: Number(track.full_duration || track.duration) || 0,
    createdAt: Date.parse(track.created_at ?? "") || 0,
    track,
  };
}

export function buildEpisodeList(tracks: unknown): Episode[] {
  const seen = new Set<number>();

  return (Array.isArray(tracks) ? tracks as Track[] : [])
    .filter((track) => (
      track?.id != null &&
      typeof track.title === "string" &&
      PROGRAM_TITLE_REGEX.test(track.title) &&
      !seen.has(track.id) &&
      !!seen.add(track.id)
    ))
    .map(toEpisode)
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || b.createdAt - a.createdAt);
}

// Os episódios são publicados com dias de antecedência: o padrão é o de hoje
// ou, se ainda não houver, o mais recente que não seja do futuro.
export function pickDefaultEpisode(episodes: Episode[], now = new Date()) {
  const today = startOfDay(now).getTime();

  return episodes.find((episode) => episode.date?.getTime() === today) ??
    episodes.find((episode) => episode.date && episode.date.getTime() <= today) ??
    episodes[0] ??
    null;
}

export const getShareCaption = (episode: Episode) => `Programa ${episode.title}`;
