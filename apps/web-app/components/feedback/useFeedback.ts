import { useMutation } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

interface FeedbackCreateRequest {
  category: string;
  content: string;
}

export function useFeedback() {
  const mutation = useMutation({
    mutationFn: (data: FeedbackCreateRequest) =>
      fetchClient.post("feedbacks", data).then((r) => r.data),
  });

  return {
    createFeedback: mutation.mutate,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
