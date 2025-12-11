import { Response } from 'express';

interface SuccessResponse {
  success: true;
  data: any;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export class ApiResponse {
  static success(res: Response, data: any, message?: string, statusCode: number = 200): Response {
    const response: SuccessResponse = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    if (details) {
      response.error.details = details;
    }

    if (requestId) {
      response.error.requestId = requestId;
    }

    return res.status(statusCode).json(response);
  }

  static created(res: Response, data: any, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

export default ApiResponse;
