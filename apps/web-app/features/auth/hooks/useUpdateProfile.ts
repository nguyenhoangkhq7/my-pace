import { useMutation } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

interface UpdateProfilePayload {
  wakeTime: string;
  sleepTime: string;
  bufferPct: number;
  bufferMinutes?: number;
  timezone?: string;
  fullName?: string;
}

interface UpdateProfileResponse {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  wakeTime?: string;
  sleepTime?: string;
  bufferPct?: number;
  bufferMinutes?: number;
  timezone?: string;
}

export function useUpdateProfile() {
  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      fetchClient.put<UpdateProfileResponse, UpdateProfilePayload>("users/profile", payload).then((r) => r.data),
  });

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
