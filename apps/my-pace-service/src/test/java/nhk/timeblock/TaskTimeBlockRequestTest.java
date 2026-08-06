package nhk.timeblock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TaskTimeBlockRequestTest {

    @Test
    @DisplayName("Should set default values when partIndex, totalParts, and availabilityStatus are null or blank")
    void testDefaultValues() {
        UUID taskId = UUID.randomUUID();
        UUID dailyPlanId = UUID.randomUUID();
        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = startTime.plusHours(1);

        TaskTimeBlockRequest request = new TaskTimeBlockRequest(
                taskId,
                dailyPlanId,
                startTime,
                endTime,
                null,
                null,
                ""
        );

        assertEquals(1, request.partIndex());
        assertEquals(1, request.totalParts());
        assertEquals("FREE", request.availabilityStatus());
    }

    @Test
    @DisplayName("Should preserve custom values when provided")
    void testCustomValues() {
        UUID taskId = UUID.randomUUID();
        UUID dailyPlanId = UUID.randomUUID();
        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = startTime.plusHours(1);

        TaskTimeBlockRequest request = new TaskTimeBlockRequest(
                taskId,
                dailyPlanId,
                startTime,
                endTime,
                2,
                4,
                "BUSY"
        );

        assertEquals(2, request.partIndex());
        assertEquals(4, request.totalParts());
        assertEquals("BUSY", request.availabilityStatus());
    }
}
