// Perfil da Rádio Educadora FM no SoundCloud, onde o programa é publicado.
export const SOUNDCLOUD_USER_ID = 391691502;
export const SOUNDCLOUD_API_URL = "https://api-v2.soundcloud.com";

// Aceita "Manhã de Luz" com ou sem acento e em qualquer caixa.
export const PROGRAM_TITLE_REGEX = /manh[ãa]\s+de\s+luz/i;

export const TRACKS_PAGE_SIZE = 50;
export const MAX_LISTED_EPISODES = 10;
export const MAX_STORED_DOWNLOADS = 5;

export const CLIENT_ID_STORAGE_KEY = "soundcloud:clientId";

export const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  "Accept": "*/*",
};
