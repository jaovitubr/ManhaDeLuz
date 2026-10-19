import { useCallback, useEffect, useRef, useState } from "react";

import { Episode } from "@/src/interfaces/episode";
import { fetchTracks } from "@/src/services/soundcloud";
import { buildEpisodeList } from "@/src/utils/episode";
import { AppError, isAbortError } from "@/src/utils/error";

interface EpisodesState {
  status: "loading" | "refreshing" | "ready" | "error";
  episodes: Episode[];
  error: unknown;
}

export default function useEpisodes() {
  const [state, setState] = useState<EpisodesState>({ status: "loading", episodes: [], error: null });
  const controllerRef = useRef<AbortController>(null);

  const load = useCallback(async (background = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({
      ...prev,
      status: background && prev.episodes.length ? "refreshing" : "loading",
      error: null,
    }));

    try {
      const episodes = buildEpisodeList(await fetchTracks(controller.signal));
      if (!episodes.length) {
        throw new AppError("NO_EPISODES", "Nenhum episódio da Manhã de Luz foi encontrado.", { retryable: true });
      }

      setState({ status: "ready", episodes, error: null });
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;

      // Se já há episódios na tela, mantém a lista e só avisa do erro.
      setState((prev) => ({ ...prev, status: prev.episodes.length ? "ready" : "error", error }));
    }
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
