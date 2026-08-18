import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

interface ErrorBody {
  success: false;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, body } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): { statusCode: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (statusCode === HttpStatus.BAD_REQUEST && typeof payload === 'object' && payload !== null && Array.isArray((payload as any).message)) {
        return {
          statusCode,
          body: {
            success: false,
            message: 'Validation failed',
            details: this.formatValidationErrors((payload as any).message as string[]),
          },
        };
      }

      const message = typeof payload === 'string' ? payload : (payload as any)?.message || exception.message;
      return { statusCode, body: { success: false, message } };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { success: false, message: 'Internal server error' },
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError): { statusCode: number; body: ErrorBody } {
    switch (exception.code) {
      case 'P2002':
        return { statusCode: HttpStatus.CONFLICT, body: { success: false, message: 'A record with this unique value already exists' } };
      case 'P2003':
        return { statusCode: HttpStatus.BAD_REQUEST, body: { success: false, message: 'Referenced record does not exist' } };
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, body: { success: false, message: 'Resource not found' } };
      default:
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, body: { success: false, message: 'Internal server error' } };
    }
  }

  private formatValidationErrors(messages: string[]): Array<{ field: string; message: string }> {
    return messages.map((message) => {
      const [field] = message.split(' ');
      return { field, message };
    });
  }
}
