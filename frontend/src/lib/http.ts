import { API_URL } from './constants';

export async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function extractError(response: Response): Promise<string> {
  const payload = await parseJsonSafe<{ message?: string | string[]; error?: string }>(response);

  if (payload?.message) {
    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }
    return payload.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  return `Ошибка запроса, статус ${response.status}`;
}

export function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }

  return `${API_URL}/${path}`;
}
