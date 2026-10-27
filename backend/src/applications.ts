
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json, parseBody, safeError, userIdFrom } from './shared/http.js';
import { parseApplication } from './shared/schema.js';

const table = process.env.APPLICATIONS_TABLE;

const db = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  { marshallOptions: { removeUndefinedValues: true } },
);

function toPublicItem<T extends Record<string, unknown>>(item: T) {
  const publicItem = { ...item };
  delete publicItem.userId;
  return publicItem;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!table) throw new Error('Server configuration error');

    const userId = userIdFrom(event);
    const method = event.requestContext.http.method;
    const id = event.pathParameters?.id;
    const now = new Date().toISOString();

    if (method === 'GET' && !id) {
      const result = await db.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
          ScanIndexForward: false,
        }),
      );

      return json(200, (result.Items || []).map(toPublicItem));
    }

    if (method === 'POST' && !id) {
      const input = parseApplication(parseBody(event));
      const item = {
        ...input,
        id: randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      };

      await db.send(
        new PutCommand({
          TableName: table,
          Item: item,
          ConditionExpression: 'attribute_not_exists(id)',
        }),
      );

      return json(201, toPublicItem(item));
    }

    if (id && method === 'GET') {
      const result = await db.send(
        new GetCommand({ TableName: table, Key: { userId, id } }),
      );

      if (!result.Item) {
        return json(404, { message: 'Application not found.' });
      }

      return json(200, toPublicItem(result.Item));
    }

    if (id && method === 'PUT') {
      const input = parseApplication(parseBody(event));
      const existing = await db.send(
        new GetCommand({ TableName: table, Key: { userId, id } }),
      );

      if (!existing.Item) {
        return json(404, { message: 'Application not found.' });
      }

      const item = {
        ...input,
        id,
        userId,
        createdAt: existing.Item.createdAt,
        updatedAt: now,
      };

      await db.send(
        new PutCommand({
          TableName: table,
          Item: item,
          ConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        }),
      );

      return json(200, toPublicItem(item));
    }

    if (id && method === 'DELETE') {
      const existing = await db.send(
        new GetCommand({ TableName: table, Key: { userId, id } }),
      );

      if (!existing.Item) {
        return json(404, { message: 'Application not found.' });
      }

      await db.send(
        new DeleteCommand({
          TableName: table,
          Key: { userId, id },
          ConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        }),
      );

      return {
        statusCode: 204,
        headers: { 'cache-control': 'no-store' },
      };
    }

    return json(405, { message: 'Method not allowed.' });
  } catch (error) {
    return safeError(error);
  }
};
