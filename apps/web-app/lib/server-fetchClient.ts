import 'server-only';
import { cookies } from 'next/headers';

const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ServerFetchOptions extends RequestInit {
  skipAuthHeader?: boolean;
}

export async function serverFetch<T>(endpoint: string, options: ServerFetchOptions = {}): Promise<T> {
  const { skipAuthHeader, ...fetchOptions } = options;
  
  // Await cookies() for Next.js 15+ compatibility
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const headers = new Headers(fetchOptions.headers);
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token && !skipAuthHeader) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${BASE_URL}/${endpoint}`;
  
  const response = await fetch(url, {
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Ignored
    }
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const json = await response.json();
  const hasWrapper = json && typeof json === "object" && "data" in json;
  
  return hasWrapper ? json.data : json;
}
