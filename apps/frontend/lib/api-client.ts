import { cookies } from 'next/headers';
import { API_BASE_URL, ACCESS_TOKEN_COOKIE } from './config';
import type { JsonRequestInit } from './http/types';
import type { ApiErrorPayload } from './types';

export interface ApiRequestOptions extends JsonRequestInit {
  skipAuth?: boolean;
  query?: Record<string, string | undefined>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const isServer = typeof window === 'undefined';

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!isServer) {
    throw new Error('apiFetch must be invoked on the server');
  }

  const { skipAuth = false, query, headers, body, json, ...rest } = options;
  const url = new URL(path, API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    }
  }

  const nextHeaders: Record<string, string> = {
    Accept: 'application/json'
  };

  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        nextHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        nextHeaders[key] = value;
      });
    } else {
      Object.assign(nextHeaders, headers);
    }
  }

  let requestBody = body;

  if (json) {
    nextHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(json);
  } else if (body && !(body instanceof FormData) && typeof body !== 'string') {
    nextHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  if (!skipAuth) {
    const token = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: nextHeaders,
    body: requestBody
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? safeParseJson(text) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(data) ?? response.statusText, data);
  }

  return data as T;
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return undefined;
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const maybePayload = payload as ApiErrorPayload;

  if (typeof maybePayload.message === 'string') {
    return maybePayload.message;
  }

  if (typeof maybePayload.detail === 'string') {
    return maybePayload.detail;
  }

  return undefined;
}
