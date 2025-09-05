import type { ContentfulStatusCode } from 'hono/utils/http-status'

interface BaseExceptionOptions {
  message: string
  errorType: string
  statusCode: ContentfulStatusCode
  details?: unknown
}

export class BaseException extends Error {
  errorType: string
  statusCode: ContentfulStatusCode
  details?: unknown

  constructor({ message, errorType, statusCode, details }: BaseExceptionOptions) {
    super(message)
    this.name = errorType
    this.errorType = errorType
    this.statusCode = statusCode
    this.details = details
  }
}

export class NotFoundException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'NotFoundException',
      statusCode: 404,
      details,
    })
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'UnauthorizedException',
      statusCode: 401,
      details,
    })
  }
}

export class ForbiddenException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'ForbiddenException',
      statusCode: 403,
      details,
    })
  }
}

export class BadRequestException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'BadRequestException',
      statusCode: 400,
      details,
    })
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'ValidationException',
      statusCode: 400,
      details,
    })
  }
}

export class InsufficientFundsException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'InsufficientFundsException',
      statusCode: 400,
      details,
    })
  }
}

export class InternalServerErrorException extends BaseException {
  constructor(message: string, details?: unknown) {
    super({
      message,
      errorType: 'InternalServerErrorException',
      statusCode: 500,
      details,
    })
  }
}
