import { ApiError } from './api-error.js';

interface PostCursor {
  published_at: string;
  id: string;
}

export function encodeCursor(cursor: PostCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(encoded: string): PostCursor {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(json) as PostCursor;
  } catch {
    throw ApiError.badRequest('Invalid pagination cursor');
  }
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export function paginateResults<T extends { published_at: Date | null; id: string }>(
  rows: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = data[data.length - 1];

  return {
    data,
    pagination: {
      next_cursor:
        hasMore && lastItem?.published_at
          ? encodeCursor({
              published_at: lastItem.published_at.toISOString(),
              id: lastItem.id,
            })
          : null,
      has_more: hasMore,
    },
  };
}
