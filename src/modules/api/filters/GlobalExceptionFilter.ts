import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
// import { JsonLogger, LoggerFactory } from 'json-logger-service';
import { v1 as uuidv1 } from 'uuid';
import { IntegrationError } from './IntegrationError';

// https://github.com/marciopd/nestjs-exceptions
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private static extractIntegrationErrorDetails(error: any): string {
    if (!(error instanceof IntegrationError)) {
      return undefined;
    }

    if (!error.causeError) {
      return undefined;
    }

    if (error.causeError instanceof String) {
      return error.causeError as string;
    }

    if (!error.causeError.message && !error.causeError.response) {
      return undefined;
    }

    const integrationErrorDetails = {
      message: error.causeError.message,
      details: error.causeError.response && error.causeError.response.data,
    };
    return JSON.stringify({ causeError: integrationErrorDetails });
  }

  // private logger: JsonLogger = LoggerFactory.createLogger(
  //   GlobalExceptionFilter.name,
  // );

  public constructor(
    private readonly sendClientInternalServerErrorCause: boolean = false,
    private readonly logAllErrors: boolean = false,
    private readonly logErrorsWithStatusCode: number[] = [],
  ) {}

  public catch(exception: any, host: ArgumentsHost): any {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      // Ensure status code is a valid HTTP status code (between 100-599)
      let responseStatus: number;
      if (typeof exception.status === 'number' && 
          exception.status >= 100 && 
          exception.status < 600) {
        responseStatus = exception.status;
      } else if (exception.status === 'error' || typeof exception.status !== 'number') {
        // Handle case where status is 'error' or any non-numeric value
        console.error(`Invalid status code detected: ${exception.status}, defaulting to 500`);
        responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      } else {
        responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      }

      const messageObject = this.getBackwardsCompatibleMessageObject(
        exception,
        responseStatus,
      );
      let errorId = undefined;
      let integrationErrorDetails = undefined;

      if (responseStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
        errorId = uuidv1();
        integrationErrorDetails =
          GlobalExceptionFilter.extractIntegrationErrorDetails(exception);

        console.error(
          {
            errorId: errorId,
            route: request.url,
            integrationErrorDetails,
            stack:
              exception.stack && JSON.stringify(exception.stack, ['stack'], 4),
          },
          messageObject,
        );
      } else if (
        this.logAllErrors ||
        this.logErrorsWithStatusCode.indexOf(responseStatus) !== -1
      ) {
        console.error(
          {
            route: request.url,
            stack: exception.stack && JSON.stringify(exception.stack),
          },
          messageObject,
        );
      }

      // Final status code validation before setting the response
      if (typeof responseStatus !== 'number' || 
          responseStatus < 100 || 
          responseStatus >= 600) {
        console.error(`Invalid status code before response: ${responseStatus}, defaulting to 500`);
        responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      }

      response.status(responseStatus).json({
        errorId: errorId,
        ...this.getClientResponseMessage(responseStatus, exception),
        integrationErrorDetails:
          responseStatus === HttpStatus.INTERNAL_SERVER_ERROR &&
          this.sendClientInternalServerErrorCause
            ? integrationErrorDetails
            : undefined,
      });
    } catch (err) {
      // Handle any errors in the exception filter itself to prevent server crashes
      console.error('Error in GlobalExceptionFilter:', err);
      
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      
      try {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error.',
          errorId: uuidv1(),
        });
      } catch (finalErr) {
        // Last resort if sending response fails
        console.error('Failed to send error response:', finalErr);
      }
    }
  }

  private getClientResponseMessage(
    responseStatus: number,
    exception: any,
  ): any {
    try {
      if (
        responseStatus !== HttpStatus.INTERNAL_SERVER_ERROR ||
        (responseStatus === HttpStatus.INTERNAL_SERVER_ERROR &&
          this.sendClientInternalServerErrorCause)
      ) {
        return this.getBackwardsCompatibleMessageObject(
          exception,
          responseStatus,
        );
      }

      return { message: 'Internal server error.', statusCode: HttpStatus.INTERNAL_SERVER_ERROR };
    } catch (err) {
      console.error('Error in getClientResponseMessage:', err);
      return { message: 'Internal server error.', statusCode: HttpStatus.INTERNAL_SERVER_ERROR };
    }
  }

  private getBackwardsCompatibleMessageObject(
    exception: any,
    responseStatus: number,
  ): any {
    try {
      const errorResponse = exception.response;
      if (errorResponse && errorResponse.error) {
        return {
          error: errorResponse.error,
          message: errorResponse.message,
          statusCode: responseStatus,
        };
      }
      return { 
        message: exception.message || 'Internal server error.', 
        statusCode: responseStatus 
      };
    } catch (err) {
      // If anything goes wrong parsing the message, return a safe default
      console.error('Error creating message object:', err);
      return { 
        message: 'Internal server error.', 
        statusCode: responseStatus 
      };
    }
  }
}
