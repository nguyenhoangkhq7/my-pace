package nhk.quickadd;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class QuickAddCacheTest {

    private QuickAddCache cache;
    private UserContextVersionService versionService;

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        cache = new QuickAddCache(3); // Small capacity for LRU eviction test
        versionService = new UserContextVersionService();
    }

    @Test
    @DisplayName("Cache put and get returns cached extraction")
    void testPutAndGet() {
        long version = versionService.getVersion(USER_ID);
        String key = cache.buildKey(USER_ID, version, "mua sữa");

        AiExtraction extraction = new AiExtraction(
                null, "open_task", "Mua sữa", null, null, null, null, null, null, null, false, null, 0.1, 0.1
        );
        cache.put(key, extraction);

        Optional<AiExtraction> cached = cache.get(key);
        assertThat(cached).isPresent();
        assertThat(cached.get().title()).isEqualTo("Mua sữa");
        assertThat(cache.getHitCount()).isEqualTo(1);
        assertThat(cache.getMissCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Bumping user context version produces new cache key and results in cache miss")
    void testVersionInvalidation() {
        long v1 = versionService.getVersion(USER_ID);
        String keyV1 = cache.buildKey(USER_ID, v1, "mua sữa");

        AiExtraction extraction = new AiExtraction(
                null, "open_task", "Mua sữa", null, null, null, null, null, null, null, false, null, 0.1, 0.1
        );
        cache.put(keyV1, extraction);

        // Version bumped (e.g. user added a new Goal or Category)
        long v2 = versionService.bumpVersion(USER_ID);
        assertThat(v2).isEqualTo(v1 + 1);

        String keyV2 = cache.buildKey(USER_ID, v2, "mua sữa");
        assertThat(keyV2).isNotEqualTo(keyV1);

        Optional<AiExtraction> cached = cache.get(keyV2);
        assertThat(cached).isEmpty();
        assertThat(cache.getMissCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("LRU eviction drops oldest accessed entry when maxCapacity exceeded")
    void testLruEviction() {
        long v = versionService.getVersion(USER_ID);
        String k1 = cache.buildKey(USER_ID, v, "task 1");
        String k2 = cache.buildKey(USER_ID, v, "task 2");
        String k3 = cache.buildKey(USER_ID, v, "task 3");
        String k4 = cache.buildKey(USER_ID, v, "task 4");

        AiExtraction e = new AiExtraction(null, "open_task", "T", null, null, null, null, null, null, null, false, null, null, null);

        cache.put(k1, e);
        cache.put(k2, e);
        cache.put(k3, e);
        assertThat(cache.size()).isEqualTo(3);

        // Put 4th entry -> k1 should be evicted
        cache.put(k4, e);
        assertThat(cache.size()).isEqualTo(3);
        assertThat(cache.get(k1)).isEmpty();
        assertThat(cache.get(k4)).isPresent();
    }
}
