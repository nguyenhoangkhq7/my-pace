package nhk.timeblock;

import jakarta.persistence.EntityNotFoundException;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskTimeBlockServiceImplTest {

    @Mock
    private TaskTimeBlockRepository timeBlockRepository;

    @Mock
    private DailyPlanRepository dailyPlanRepository;

    @Mock
    private nhk.planning.DailyPlanTaskRepository dailyPlanTaskRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private nhk.timelog.TimeLogRepository timeLogRepository;

    @InjectMocks
    private TaskTimeBlockServiceImpl timeBlockService;

    private UUID userId;
    private UUID dailyPlanId;
    private UUID taskId;
    private UUID blockId;
    private DailyPlan samplePlan;
    private TaskTimeBlock sampleBlock;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        dailyPlanId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        blockId = UUID.randomUUID();

        samplePlan = new DailyPlan();
        samplePlan.setId(dailyPlanId);
        samplePlan.setUserId(userId);

        sampleBlock = new TaskTimeBlock();
        sampleBlock.setId(blockId);
        sampleBlock.setTaskId(taskId);
        sampleBlock.setTaskId(taskId);
        sampleBlock.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
        sampleBlock.setEndTime(LocalDateTime.of(2026, 8, 2, 10, 0));
        sampleBlock.setPartIndex(1);
        sampleBlock.setTotalParts(1);
        sampleBlock.setAvailabilityStatus("FREE");
    }

    @Nested
    @DisplayName("getTimeBlocks Tests")
    class GetTimeBlocksTests {

        @Test
        @DisplayName("Should return list of time block DTOs when plan exists and belongs to user")
        void getTimeBlocks_Success() {
            when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of(sampleBlock));

            List<TaskTimeBlockDto> result = timeBlockService.getTimeBlocks(LocalDate.now(), LocalDate.now(), userId);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(blockId, result.get(0).id());
            assertEquals(taskId, result.get(0).taskId());
            assertEquals("FREE", result.get(0).availabilityStatus());
            verify(timeBlockRepository, times(1)).findByUserIdAndDateRange(eq(userId), any(), any());
        }

        // tests removed
    }

    @Nested
    @DisplayName("saveTimeBlocks Tests")
    class SaveTimeBlocksTests {

        @Test
        @DisplayName("Should replace existing blocks and save new ones successfully")
        void saveTimeBlocks_Success() {
            TaskTimeBlockRequest requestItem = new TaskTimeBlockRequest(
                    taskId,
                    dailyPlanId,
                    LocalDateTime.of(2026, 8, 2, 9, 0),
                    LocalDateTime.of(2026, 8, 2, 10, 0),
                    null,
                    null,
                    null
            );
            SaveTimeBlocksRequest saveRequest = new SaveTimeBlocksRequest(LocalDate.now(), List.of(requestItem));

            when(timeBlockRepository.saveAll(anyList())).thenAnswer(invocation -> {
                List<TaskTimeBlock> list = invocation.getArgument(0);
                list.get(0).setId(blockId);
                return list;
            });

            List<TaskTimeBlockDto> result = timeBlockService.saveTimeBlocks(saveRequest, userId);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(blockId, result.get(0).id());
            assertEquals(1, result.get(0).partIndex());
            assertEquals(1, result.get(0).totalParts());
            assertEquals("FREE", result.get(0).availabilityStatus());

            verify(timeBlockRepository, times(1)).deleteByUserIdAndDate(eq(userId), any(), any());
            verify(timeBlockRepository, times(1)).saveAll(anyList());
        }

        // tests removed
    }

    @Nested
    @DisplayName("updateTimeBlock Tests")
    class UpdateTimeBlockTests {

        @Test
        @DisplayName("Should update fields and task estimated minutes")
        void updateTimeBlock_Success() {
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            task.setEstimatedMinutes(60);

            TaskTimeBlockController.UpdateTimeBlockRequest request =
                    new TaskTimeBlockController.UpdateTimeBlockRequest(
                            LocalDateTime.of(2026, 8, 2, 9, 30),
                            LocalDateTime.of(2026, 8, 2, 10, 30),
                            "BUSY"
                    );

            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            when(timeBlockRepository.save(any(TaskTimeBlock.class))).thenAnswer(inv -> inv.getArgument(0));
            when(timeBlockRepository.findByTaskId(taskId)).thenReturn(List.of(sampleBlock));
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

            TaskTimeBlockDto result = timeBlockService.updateTimeBlock(blockId, request, userId);

            assertNotNull(result);
            assertEquals(LocalDateTime.of(2026, 8, 2, 9, 30), sampleBlock.getStartTime());
            assertEquals(LocalDateTime.of(2026, 8, 2, 10, 30), sampleBlock.getEndTime());
            assertEquals("BUSY", sampleBlock.getAvailabilityStatus());
            assertEquals(60, task.getEstimatedMinutes());
            verify(timeBlockRepository, times(1)).save(sampleBlock);
            verify(taskRepository, times(1)).save(task);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when timeblock not found")
        void updateTimeBlock_BlockNotFound() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.empty());

            TaskTimeBlockController.UpdateTimeBlockRequest request =
                    new TaskTimeBlockController.UpdateTimeBlockRequest(null, null, "BUSY");

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> timeBlockService.updateTimeBlock(blockId, request, userId)
            );
            assertEquals("Time block not found", ex.getMessage());
        }
    }

    @Nested
    @DisplayName("splitTimeBlock Tests")
    class SplitTimeBlockTests {

        @Test
        @DisplayName("Should split block into two at specified splitAtMinutes")
        void splitTimeBlock_CustomSplitAt() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

            TaskTimeBlock newBlock = new TaskTimeBlock();
            newBlock.setId(UUID.randomUUID());
            newBlock.setTaskId(taskId);
            newBlock.setStartTime(sampleBlock.getStartTime().plusMinutes(20));
            newBlock.setEndTime(sampleBlock.getEndTime());

            when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                    .thenReturn(List.of(sampleBlock, newBlock));

            List<TaskTimeBlockDto> result = timeBlockService.splitTimeBlock(blockId, 20, userId);

            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals(LocalDateTime.of(2026, 8, 2, 9, 20), sampleBlock.getEndTime());
            verify(timeBlockRepository, times(2)).save(any(TaskTimeBlock.class));
        }

        @Test
        @DisplayName("Should split block at midpoint when splitAtMinutes is null")
        void splitTimeBlock_DefaultSplitAt() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

            when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                    .thenReturn(List.of(sampleBlock));

            List<TaskTimeBlockDto> result = timeBlockService.splitTimeBlock(blockId, null, userId);

            assertNotNull(result);
            // Block duration is 60m (9:00 -> 10:00), midpoint is 30m -> end time set to 9:30
            assertEquals(LocalDateTime.of(2026, 8, 2, 9, 30), sampleBlock.getEndTime());
            verify(timeBlockRepository, times(2)).save(any(TaskTimeBlock.class));
        }

        @Test
        @DisplayName("Should return original block without splitting when block duration is <= 1 minute")
        void splitTimeBlock_ShortBlockDuration_ReturnsOriginal() {
            sampleBlock.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            sampleBlock.setEndTime(LocalDateTime.of(2026, 8, 2, 9, 1)); // 1 min duration

            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

            List<TaskTimeBlockDto> result = timeBlockService.splitTimeBlock(blockId, null, userId);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(blockId, result.get(0).id());
            verify(timeBlockRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when block not found for split")
        void splitTimeBlock_BlockNotFound() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> timeBlockService.splitTimeBlock(blockId, 30, userId)
            );
            assertEquals("Time block not found", ex.getMessage());
        }

        // tests removed
    }

    @Nested
    @DisplayName("toggleTimeBlockLockStatus Tests")
    class ToggleLockStatusTests {

        @Test
        @DisplayName("Should set status to BUSY when availabilityStatus is BUSY or busy")
        void toggleLockStatus_Busy() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
            when(timeBlockRepository.save(any(TaskTimeBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskTimeBlockDto result = timeBlockService.toggleTimeBlockLockStatus(blockId, "busy", userId);

            assertNotNull(result);
            assertEquals("BUSY", result.availabilityStatus());
            verify(timeBlockRepository, times(1)).save(sampleBlock);
        }

        @Test
        @DisplayName("Should set status to FREE when availabilityStatus is FREE or other string")
        void toggleLockStatus_Free() {
            sampleBlock.setAvailabilityStatus("BUSY");
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.of(sampleBlock));
            Task task = new Task();
            task.setId(taskId);
            task.setUserId(userId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
            when(timeBlockRepository.save(any(TaskTimeBlock.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskTimeBlockDto result = timeBlockService.toggleTimeBlockLockStatus(blockId, "FREE", userId);

            assertNotNull(result);
            assertEquals("FREE", result.availabilityStatus());
            verify(timeBlockRepository, times(1)).save(sampleBlock);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when block not found for toggle")
        void toggleLockStatus_BlockNotFound() {
            when(timeBlockRepository.findById(blockId)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> timeBlockService.toggleTimeBlockLockStatus(blockId, "BUSY", userId)
            );
            assertEquals("Time block not found", ex.getMessage());
        }

        // tests removed
    }
}
