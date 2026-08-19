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

    @Test
    @DisplayName("In-text scan: Acronym KLTN in sentence → Khóa luận tốt nghiệp UUID")
    void testResolveFromTextAcronym() {
        UUID id = goalResolver.resolveFromText("Làm slide KLTN tối nay", List.of(marathonGoal, kltnGoal));
        assertThat(id).isEqualTo(kltnGoal.getId());
    }

    @Test
    @DisplayName("In-text scan: Full title in sentence → Chạy Marathon 2026 UUID")
    void testResolveFromTextFullTitle() {
        UUID id = goalResolver.resolveFromText("Tập luyện cho Chạy Marathon 2026 sáng mai 6h", List.of(marathonGoal, kltnGoal));
        assertThat(id).isEqualTo(marathonGoal.getId());
    }

    @Test
    @DisplayName("In-text scan: No match returns null")
    void testResolveFromTextNoMatch() {
        UUID id = goalResolver.resolveFromText("Đi siêu thị mua sữa", List.of(marathonGoal, kltnGoal));
        assertThat(id).isNull();
    }
}
