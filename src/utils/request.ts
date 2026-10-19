import { AppError, abortError } from "./error";

type ResponseType = "json" | "text" | "bytes";

type ResponseData<T extends ResponseType> = T extends "text" ? string : T extends "bytes" ? Uint8Array : any;

interface RequestOptions<T extends ResponseType> {
  as?: T;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
  fetchImpl?: (url: string, init: { headers?: Record<string, string>; signal: AbortSignal }) => Promise<Response>;
}

function toAppError(error: unknown, timedOut: boolean) {
  if (error instanceof AppError) return error;
  if (timedOut) return new AppError("TIMEOUT", "A conexão demorou demais. Verifique sua internet.", { cause: error, retryable: true });
  if (error instanceof SyntaxError) return new AppError("INVALID_RESPONSE", "O SoundCloud respondeu em um formato inesperado.", { cause: error });
  return new AppError("NETWORK", "Sem conexão com a internet. Verifique sua rede.", { cause: error, retryable: true });
}

function toHttpError(status: number) {
  if (status === 401 || status === 403) return new AppError("UNAUTHORIZED", "Acesso negado pelo SoundCloud.", { status });
  if (status === 404) return new AppError("NOT_FOUND", "Conteúdo não encontrado no SoundCloud.", { status });
  if (status === 429) return new AppError("RATE_LIMITED", "Muitas tentativas seguidas. Aguarde um pouco.", { status, retryable: true });
  if (status >= 500) return new AppError("SERVER", "O SoundCloud está instável no momento.", { status, retryable: true });
  return new AppError("HTTP", `Resposta inesperada do servidor (${status}).`, { status });
}

/**
 * fetch com timeout, cancelamento e novas tentativas com backoff exponencial.
 * Só repete erros transitórios (rede, timeout, 429, 5xx).
 */
export async function request<T extends ResponseType = "json">(
  url: string,
  { as, headers, signal, timeout = 15000, retries = 2, fetchImpl = fetch }: RequestOptions<T> = {}
): Promise<ResponseData<T>> {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw abortError();

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    signal?.addEventListener("abort", onAbort);

    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal });
      if (!response.ok) throw toHttpError(response.status);

      if (as === "text") return await response.text() as ResponseData<T>;
      if (as === "bytes") return new Uint8Array(await response.arrayBuffer()) as ResponseData<T>;
      return await response.json();
    } catch (error) {
      if (signal?.aborted) throw abortError();

      const appError = toAppError(error, timedOut);
      if (!appError.retryable || attempt >= retries) throw appError;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }

    await new Promise((resolve) => setTimeout(resolve, 600 * 2 ** attempt));
  }
}

export function withQuery(url: string, params: Record<string, string | number | undefined | null>) {
  const query = Object.entries(params)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`)
    .join("&");

  return query ? `${url}${url.includes("?") ? "&" : "?"}${query}` : url;
}
