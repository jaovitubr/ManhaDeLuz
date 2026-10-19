// Campos usados da API v2 do SoundCloud (a resposta tem muito mais).
export interface Transcoding {
  url: string;
  snipped?: boolean;
  format?: {
    protocol?: "progressive" | "hls" | string;
    mime_type?: string;
  };
}

export interface Track {
  id: number;
  title: string;
  artwork_url?: string | null;
  duration?: number;
  full_duration?: number;
  created_at?: string;
  display_date?: string;
  release_date?: string | null;
  track_authorization?: string;
  media?: { transcodings?: Transcoding[] };
  user?: { avatar_url?: string };
}

export interface Episode {
  id: string;
  title: string;
  date: Date | null;
  dateKey: string | null;
  artworkUrl: string | null;
  durationMs: number;
  createdAt: number;
  track: Track;
}

export interface AudioFormat {
  extension: "mp3" | "m4a" | "aac" | "ts";
  mimeType: string;
  uti: string;
}

export interface DownloadedFile extends AudioFormat {
  uri: string;
}
