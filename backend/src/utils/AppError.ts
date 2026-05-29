export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export const createError = {
  badRequest: (msg: string, code?: string) => new AppError(msg, 400, code),
  unauthorized: (msg = 'Não autorizado') => new AppError(msg, 401, 'UNAUTHORIZED'),
  forbidden: (msg = 'Acesso negado') => new AppError(msg, 403, 'FORBIDDEN'),
  notFound: (msg = 'Recurso não encontrado') => new AppError(msg, 404, 'NOT_FOUND'),
  conflict: (msg: string, code?: string) => new AppError(msg, 409, code),
  tooMany: (msg = 'Muitas requisições') => new AppError(msg, 429, 'TOO_MANY_REQUESTS'),
  internal: (msg = 'Erro interno') => new AppError(msg, 500, 'INTERNAL_ERROR'),
};
