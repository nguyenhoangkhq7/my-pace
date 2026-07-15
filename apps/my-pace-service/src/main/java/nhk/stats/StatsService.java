package nhk.stats;

import java.util.UUID;

public interface StatsService {
    StatsResponse getOverview(UUID userId, String startDateStr, String endDateStr);
}
