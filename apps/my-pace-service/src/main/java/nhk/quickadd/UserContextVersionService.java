package nhk.quickadd;

import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Manages user context versions for Quick Add caching.
 *
 * Provides O(1) version retrieval. When a user creates, updates, or deletes
 * categories, goals, or scheduling preferences, bumping the version invalidates
 * the user's cached AI extractions without expensive text/object re-hashing.
 *
 * Note: This implementation is instance-local in-memory. If deploying multiple backend service
 * instances with distributed caching in the future, this version state should be backed
 * by Redis or persisted in the database user_context_metadata table.
 */
@Service
public class UserContextVersionService {

    private final ConcurrentHashMap<UUID, AtomicLong> userVersions = new ConcurrentHashMap<>();

    private static final UUID ANONYMOUS_USER = UUID.fromString("00000000-0000-0000-0000-000000000000");

    /**
     * Returns the current context version for the given user (O(1)).
     */
    public long getVersion(UUID userId) {
        UUID effectiveId = userId != null ? userId : ANONYMOUS_USER;
        return userVersions.computeIfAbsent(effectiveId, id -> new AtomicLong(1L)).get();
    }

    /**
     * Increments the context version for the given user, invalidating existing cache entries.
     */
    public long bumpVersion(UUID userId) {
        UUID effectiveId = userId != null ? userId : ANONYMOUS_USER;
        return userVersions.computeIfAbsent(effectiveId, id -> new AtomicLong(1L)).incrementAndGet();
    }

    /**
     * Resets all user versions (primarily for testing and cache reset).
     */
    public void reset() {
        userVersions.clear();
    }
}
