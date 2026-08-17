package nhk.quickadd;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe, bounded in-memory LRU cache for Quick Add AI extractions.
 * Uses a version-based cache key strategy:
 *   quickadd:v1:{userId}:{contextVersion}:{textHash}
 */
@Slf4j
@Component
public class QuickAddCache {

    public static final int DEFAULT_MAX_ENTRIES = 1000;

    private static class LruMap<K, V> extends LinkedHashMap<K, V> {
        private final int maxEntries;

        public LruMap(int maxEntries) {
            super(128, 0.75f, true); // access-order
            this.maxEntries = maxEntries;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxEntries;
        }
    }

    private final Map<String, AiExtraction> cache;
    private final int maxCapacity;

    private final AtomicLong hitCount = new AtomicLong(0);
    private final AtomicLong missCount = new AtomicLong(0);

    public QuickAddCache() {
        this(DEFAULT_MAX_ENTRIES);
    }

    public QuickAddCache(int maxCapacity) {
        this.maxCapacity = maxCapacity;
        this.cache = Collections.synchronizedMap(new LruMap<>(maxCapacity));
    }

    /**
     * Builds standard cache key: quickadd:v1:{userId}:{contextVersion}:{textHash}
     */
    public String buildKey(UUID userId, long contextVersion, String rawText) {
        String uid = (userId != null) ? userId.toString() : "anonymous";
        String normalized = normalizeTextForHashing(rawText);
        String textHash = computeSha256Hex(normalized);
        return String.format("quickadd:v1:%s:%d:%s", uid, contextVersion, textHash);
    }

    public Optional<AiExtraction> get(String key) {
        if (key == null) return Optional.empty();
        AiExtraction value = cache.get(key);
        if (value != null) {
            hitCount.incrementAndGet();
            log.trace("QuickAdd cache hit for key: {}", key);
            return Optional.of(value);
        }
        missCount.incrementAndGet();
        return Optional.empty();
    }

    public void put(String key, AiExtraction extraction) {
        if (key != null && extraction != null) {
            cache.put(key, extraction);
        }
    }

    public void clear() {
        cache.clear();
        hitCount.set(0);
        missCount.set(0);
    }

    public int size() {
        return cache.size();
    }

    public long getHitCount() {
        return hitCount.get();
    }

    public long getMissCount() {
        return missCount.get();
    }

    private String normalizeTextForHashing(String raw) {
        if (raw == null) return "";
        return raw.trim()
                .toLowerCase()
                .replaceAll("\\s+", " ")
                .replaceAll("[.?!,;:]+$", "");
    }

    private String computeSha256Hex(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            // 16 chars (64-bit prefix) is sufficiently compact and collision-resistant for cache keys
            for (int i = 0; i < Math.min(hash.length, 8); i++) {
                String hex = Integer.toHexString(0xff & hash[i]);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(text.hashCode());
        }
    }
}
