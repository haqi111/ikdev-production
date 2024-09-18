import { HttpException, HttpStatus } from '@nestjs/common';

export class ErrorHandler {
  static handleError(error: any): never {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Server Error, cannot process the request';

    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      message = (typeof error.getResponse() === 'string') ? error.getResponse() : (error.getResponse() as any)['message'] || message;
    } else if (error instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = error.message || message;
    }

    console.error(error);

    throw new HttpException(
      {
        statusCode: statusCode,
        message: message,
      },
      statusCode,
    );
  }
}
