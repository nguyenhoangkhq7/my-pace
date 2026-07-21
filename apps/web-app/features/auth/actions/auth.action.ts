'use server';

import { cookies } from 'next/headers';
import { LoginValues, RegisterValues } from '@/features/auth/schema/auth.schema';
import { serverFetch } from '@/lib/server-fetchClient';
import { AuthUser } from '@/features/auth/store/auth.store';

const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface AuthResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
    user?: AuthUser;
  };
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: AuthUser;
}

// Helper function to extract tokens and user from raw response JSON
function extractAuthData(json: AuthResponse | null | undefined) {
  const accessToken = json?.data?.accessToken || json?.accessToken || json?.data?.token || json?.token;
  const refreshToken = json?.data?.refreshToken || json?.refreshToken;
  const user = json?.data?.user || json?.user;
  return { accessToken, refreshToken, user };
}

// Helper function to set cookie store variables for tokens and settings
export async function setAuthCookies(tokens: { accessToken?: string; refreshToken?: string; timezone?: string }) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  if (tokens.accessToken) {
    cookieStore.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  if (tokens.refreshToken) {
    cookieStore.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  if (tokens.timezone) {
    cookieStore.set('timezone', tokens.timezone, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }
}

export async function loginAction(data: LoginValues) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Login failed' };
    }

    const json = await response.json();
    const { accessToken, refreshToken, user } = extractAuthData(json);
    
    if (!accessToken) {
      return { success: false, error: 'Invalid token received from server' };
    }

    await setAuthCookies({
      accessToken,
      refreshToken,
      timezone: user?.timezone || 'Asia/Ho_Chi_Minh',
    });

    return { success: true, user };
  } catch (err) {
    console.error('Login action error:', err);
    return { success: false, error: 'Cannot connect to the server' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  try {
    await serverFetch('auth/logout', { method: 'POST' });
  } catch {
    // Ignore error on logout
  }
}

export async function requestOtpAction(data: { email: string }) {
  try {
    const response = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Failed to request OTP' };
    }

    return { success: true };
  } catch (err) {
    console.error('Request OTP action error:', err);
    return { success: false, error: 'Cannot connect to the server' };
  }
}

export async function verifyOtpAction(data: { email: string; otp: string }) {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Invalid OTP' };
    }

    return { success: true };
  } catch (err) {
    console.error('Verify OTP action error:', err);
    return { success: false, error: 'Cannot connect to the server' };
  }
}

export async function registerAction(data: Omit<RegisterValues, 'confirmPassword'>) {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Registration failed' };
    }

    const json = await response.json();
    const { accessToken, refreshToken, user } = extractAuthData(json);

    if (!accessToken) {
      return { success: false, error: 'Invalid token received from server' };
    }

    await setAuthCookies({
      accessToken,
      refreshToken,
      timezone: user?.timezone || 'Asia/Ho_Chi_Minh',
    });

    return { success: true, user };
  } catch (err) {
    console.error('Register action error:', err);
    return { success: false, error: 'Cannot connect to the server' };
  }
}


export async function getSessionAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return { success: false, error: 'No refresh token' };
  }

  try {
    // Explicitly forward the refresh token to Spring Boot
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'GET', // usually GET for refresh
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`
      },
    });

    if (!response.ok) {
      // If refresh fails, we might want to clear cookies, but Next.js Server Actions 
      // can do it safely here.
      cookieStore.delete('accessToken');
      cookieStore.delete('refreshToken');
      return { success: false, error: 'Failed to refresh token' };
    }

    const json = await response.json();
    const { accessToken, refreshToken: newRefreshToken, user } = extractAuthData(json);

    if (!accessToken) {
      return { success: false, error: 'No access token in response' };
    }

    await setAuthCookies({
      accessToken,
      refreshToken: newRefreshToken,
    });

    return { success: true, user };
  } catch (err) {
    console.error('Get session action error:', err);
    return { success: false, error: 'Server error' };
  }
}
