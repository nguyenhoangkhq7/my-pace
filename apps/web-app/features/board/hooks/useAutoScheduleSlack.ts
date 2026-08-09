import { useCallback, useState } from "react";
import { fetchClient } from "@/lib/fetchClient";

export interface PreviewSlackRequest {
  dueDate: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
}

export interface PreviewSlackResponse {
  trueSlackTime: number;
}

export function usePreviewSlack() {
  const [loading, setLoading] = useState(false);

  const previewSlack = useCallback(async (request: PreviewSlackRequest): Promise<number | null> => {
    try {
      setLoading(true);
      const res = await fetchClient.post<PreviewSlackResponse>("auto-schedule/preview-slack", request);
      return res.data.trueSlackTime;
    } catch (e) {
      console.error("Failed to preview slack", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { previewSlack, loading };
}

export interface BatchSlackRequest {
  taskIds: string[];
}

export interface BatchSlackResponse {
  slackTimes: Record<string, number>;
}

export function useBatchSlack() {
  const [loading, setLoading] = useState(false);

  const batchSlack = useCallback(async (taskIds: string[]): Promise<Record<string, number> | null> => {
    if (!taskIds || taskIds.length === 0) return {};
    
    try {
      setLoading(true);
      const res = await fetchClient.post<BatchSlackResponse>("auto-schedule/batch-slack", { taskIds });
      return res.data.slackTimes;
    } catch (e) {
      console.error("Failed to fetch batch slack", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { batchSlack, loading };
}
