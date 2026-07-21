'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { AuthUser } from '@/features/auth/store/auth.store';
import { setAuthCookies } from '@/features/auth/actions/auth.action';

interface UpdateProfileResponse {
  timezone?: string;
  [key: string]: unknown;
}

export async function updateProfileAction(payload: Partial<AuthUser>) {
  try {
    const data = await serverFetch<UpdateProfileResponse>('users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Sync timezone cookie so Next.js Server Components render the correct date after page refresh
    if (data?.timezone) {
      await setAuthCookies({ timezone: data.timezone });
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return { success: false, error: message };
  }
}
