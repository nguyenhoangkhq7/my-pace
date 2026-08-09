package nhk.scheduling;

import java.util.List;
import java.util.UUID;

public record BatchSlackRequest(
    List<UUID> taskIds
) {}
