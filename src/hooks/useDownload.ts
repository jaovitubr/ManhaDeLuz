import { useEffect, useRef, useState } from "react";

import { DownloadedFile, Episode } from "@/src/interfaces/episode";
import { downloadEpisode, findDownloaded } from "@/src/services/download";

interface DownloadState {
  status: "idle" | "downloading" | "done" | "error";
  progress: number;
  file: DownloadedFile | null;
  error: unknown;
}

const IDLE: DownloadState = { status: "idle", progress: 0, file: null, error: null };

function getInitialState(episode: Episode | null): DownloadState {
  const file = episode && findDownloaded(episode);
  return file ? { ...IDLE, status: "done", progress: 1, file } : IDLE;
}

export default function useDownload(episode: Episode | null) {
  const [state, setState] = useState(() => getInitialState(episode));
  const [episodeId, setEpisodeId] = useState(episode?.id);
  const controllerRef = useRef<AbortController>(null);

  // Ao trocar de episódio, verifica se o novo já foi baixado. Compara só o id
  // para que recarregar a lista não interrompa um download em andamento.
  if (episodeId !== episode?.id) {
    setEpisodeId(episode?.id);
    setState(getInitialState(episode));
  }

  // Cancela o download do episódio anterior (e ao sair da tela).
  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, [episode?.id]);

  async function start() {
    if (!episode || controllerRef.current) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ ...IDLE, status: "downloading" });

    try {
      const file = await downloadEpisode(episode, {
        signal: controller.signal,
        onProgress: (progress) => !controller.signal.aborted && setState((prev) => ({
          ...prev,
          progress: Math.max(0, Math.min(1, progress)),
        })),
      });

      if (!controller.signal.aborted) setState({ ...IDLE, status: "done", progress: 1, file });
    } catch (error) {
      if (!controller.signal.aborted) setState({ ...IDLE, status: "error", error });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function cancel() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(IDLE);
  }

  return { ...state, start, cancel };
}
