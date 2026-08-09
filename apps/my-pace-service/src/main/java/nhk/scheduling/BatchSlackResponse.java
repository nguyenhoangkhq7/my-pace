package nhk.scheduling;

import java.util.Map;
import java.util.UUID;

public record BatchSlackResponse(
    Map<UUID, Integer> slackTimes
) {}
