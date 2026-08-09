package nhk.scheduling;

import java.util.UUID;

public interface AutoScheduleService {
    AutoScheduleResponse autoSchedule(UUID userId, Integer bufferMinutes);
    PreviewSlackResponse previewSlack(UUID userId, PreviewSlackRequest request, Integer bufferMinutes);
    BatchSlackResponse batchSlack(UUID userId, BatchSlackRequest request, Integer bufferMinutes);
}

