import { fetchClient } from "@/lib/fetchClient";

export interface FeedbackCreateRequest {
  category: string;
  content: string;
}

export const feedbackApi = {
  createFeedback: (data: FeedbackCreateRequest) => fetchClient.post<unknown, FeedbackCreateRequest>("feedbacks", data),
};
