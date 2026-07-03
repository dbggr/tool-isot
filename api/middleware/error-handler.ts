/**
 * Global error handling middleware
 * Standardizes error responses across the API
 */

import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError, ConflictError, DatabaseError } from '../utils/errors';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { applyCorsHeaders } from './cors';

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Error codes for different error types
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'Bad Request',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  DATABASE_ERROR: 'Database Error',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  BAD_REQUEST: 'Bad Request'
} as const;

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  details?: any,
  request?: NextRequest
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  const response = NextResponse.json(errorResponse, { status: statusCode });
  
  // Apply CORS headers if request is provided
  if (request) {
    return applyCorsHeaders(response, request) as NextResponse<ApiErrorResponse>;
  }
  
  return response;
}

/**
 * Handles different types of errors and returns appropriate responses
 */
export function handleApiError(error: unknown, context?: string, request?: NextRequest): NextResponse<ApiErrorResponse> {
  // Log the error for debugging
  logger.error('API Error', { error, context });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      400,
      details,
      request
    );
  }

  // Handle custom validation errors
  if (error instanceof ValidationError) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      error.message,
      400,
      error.field ? { field: error.field } : undefined,
      request
    );
  }

  // Handle not found errors
  if (error instanceof NotFoundError) {
    return createErrorResponse(
      ERROR_CODES.NOT_FOUND,
      error.message,
      404,
      undefined,
      request
    );
  }

  // Handle conflict errors
  if (error instanceof ConflictError) {
    return createErrorResponse(
      ERROR_CODES.CONFLICT,
      error.message,
      409,
      undefined,
      request
    );
  }

  // Handle database errors
  if (error instanceof DatabaseError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      'Database operation failed',
      500,
      undefined,
      request
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      500,
      undefined,
      request
    );
  }

  // Handle unknown errors
  return createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    'An unknown error occurred',
    500,
    undefined,
    request
  );
}

/**
 * Wrapper function for API route handlers that provides automatic error handling
 * and ensures database initialization
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Ensure database is initialized before handling any request
      const { ensureDatabaseInitialized } = await import('../database/init');
      await ensureDatabaseInitialized();
      
      return await handler(...args);
    } catch (error) {
      // Extract request object from args if available (first argument is typically NextRequest)
      const request = args.length > 0 && args[0] instanceof Request ? args[0] as NextRequest : undefined;
      return handleApiError(error, context, request);
    }
  };
}

/**
 * Higher-order function for wrapping API route handlers with error handling
 */
export function apiErrorHandler(context?: string) {
  return function <T extends any[]>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<NextResponse>>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return;

    descriptor.value = async function (...args: T): Promise<NextResponse> {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return handleApiError(error, context || `${target.constructor.name}.${propertyKey}`);
      }
    };
  };
}