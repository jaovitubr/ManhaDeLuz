// Erro padronizado do app: `code` permite decidir o que fazer (tentar de novo,
// renovar o client ID...) e `message` já vem pronta para mostrar ao usuário.
export class AppError extends Error {
  code: string;
  retryable: boolean;
  status?: number;

  constructor(code: string, message: string, options: { cause?: unknown; retryable?: boolean; status?: number } = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

export const abortError = () => new AppError("ABORTED", "Operação cancelada.");

export const isAbortError = (error: unknown) => error instanceof AppError && error.code === "ABORTED";

export function getErrorMessage(error: unknown) {
  return error instanceof AppError ? error.message : "Algo deu errado. Tente novamente.";
}
