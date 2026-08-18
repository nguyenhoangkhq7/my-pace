package nhk.quickadd;

import nhk.goal.Goal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GoalResolverTest {

    private GoalResolver goalResolver;
    private Goal marathonGoal;
    private Goal kltnGoal;

    @BeforeEach
    void setUp() {
        goalResolver = new GoalResolver();
        marathonGoal = new Goal();
        marathonGoal.setId(UUID.randomUUID());
        marathonGoal.setTitle("Chạy Marathon 2026");

        kltnGoal = new Goal();
        kltnGoal.setId(UUID.randomUUID());
        kltnGoal.setTitle("Khóa luận tốt nghiệp");
    }

    @Test
    @DisplayName("De-underscores @goal hint: @Chạy_Marathon_2026 → Chạy Marathon 2026 UUID")
    void testDeUnderscoredGoal() {
        UUID id = goalResolver.resolve("@Chạy_Marathon_2026", List.of(marathonGoal, kltnGoal));
        assertThat(id).isEqualTo(marathonGoal.getId());
    }

    @Test
    @DisplayName("Acronym match: @KLTN → Khóa luận tốt nghiệp UUID")
    void testAcronymGoal() {
        UUID id = goalResolver.resolve("KLTN", List.of(marathonGoal, kltnGoal));
        assertThat(id).isEqualTo(kltnGoal.getId());
    }
}
