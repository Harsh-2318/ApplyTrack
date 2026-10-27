
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

export type HandlerEvent = APIGatewayProxyEventV2;

export function json(
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

export function userIdFrom(event: HandlerEvent): string {
  const context = event.requestContext as HandlerEvent['requestContext'] & {
    authorizer?: {
      jwt?: {
        claims?: {
          sub?: string;
        };
      };
    };
  };

  const id = context.authorizer?.jwt?.claims?.sub;

  if (typeof id !== 'string' || !id) {
    throw new Error('UNAUTHORIZED');
  }

  return id;
}

export function parseBody(event: HandlerEvent): unknown {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error('INVALID_JSON');
  }
}

export function safeError(
  error: unknown,
): APIGatewayProxyStructuredResultV2 {
  const message =
    error instanceof Error ? error.message : 'Unexpected error';

  if (message === 'UNAUTHORIZED') {
    return json(401, {
      message: 'Authentication is required.',
    });
  }

  if (message === 'INVALID_JSON') {
    return json(400, {
      message: 'Request body must be valid JSON.',
    });
  }

  if (message === 'NOT_FOUND') {
    return json(404, {
      message: 'Application not found.',
    });
  }

  if (message.startsWith('VALIDATION:')) {
    return json(400, {
      message: message.slice(11),
    });
  }

  console.error(
    'Request failed:',
    error instanceof Error ? error.name : 'UnknownError',
  );

  return json(500, {
    message: 'An unexpected error occurred. Please try again.',
  });
}
