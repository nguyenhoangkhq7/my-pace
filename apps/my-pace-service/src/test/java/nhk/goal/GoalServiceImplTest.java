package nhk.goal;

import nhk.category.CategoryRepository;
import nhk.common.GoalNotFoundException;
import nhk.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoalServiceImplTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private GoalMapper goalMapper;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private GoalServiceImpl goalService;

    private UUID userId;
    private UUID categoryId;
    private UUID goalId;
    private Goal sampleGoal;
    private GoalDto sampleGoalDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        goalId = UUID.randomUUID();

        sampleGoal = new Goal();
        sampleGoal.setId(goalId);
        sampleGoal.setUserId(userId);
        sampleGoal.setCategoryId(categoryId);
        sampleGoal.setTitle("Learn Java");
        sampleGoal.setGoalType("Milestone");
        sampleGoal.setStatus("In Progress");
        sampleGoal.setProgressPct(0);
        sampleGoal.setAutoCreateTask(false);

        sampleGoalDto = new GoalDto(
                goalId,
                "Learn Java",
                "Milestone",
                "In Progress",
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                categoryId,
                0,
                false,
                null,
                null,
                null
        );
    }

    @Nested
    @DisplayName("getGoals Tests")
    class GetGoalsTests {

        @Test
        @DisplayName("Should return list of GoalDto when goals exist for user")
        void getGoals_Success() {
            when(goalRepository.findByUserId(userId)).thenReturn(List.of(sampleGoal));
            when(goalMapper.toDto(sampleGoal)).thenReturn(sampleGoalDto);

            List<GoalDto> result = goalService.getGoals(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(goalId);
            verify(goalRepository, times(1)).findByUserId(userId);
            verify(goalMapper, times(1)).toDto(sampleGoal);
        }

        @Test
        @DisplayName("Should return empty list when no goals exist for user")
        void getGoals_Empty() {
            when(goalRepository.findByUserId(userId)).thenReturn(List.of());

            List<GoalDto> result = goalService.getGoals(userId);

            assertThat(result).isEmpty();
            verify(goalRepository, times(1)).findByUserId(userId);
        }
    }

    @Nested
    @DisplayName("createGoal Tests")
    class CreateGoalTests {

        @Test
        @DisplayName("Should throw IllegalArgumentException when categoryId is null")
        void createGoal_NullCategory_ThrowsException() {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Title", "Milestone", null, null, null, false, null, null, null
            );

            assertThatThrownBy(() -> goalService.createGoal(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid category ID");

            verify(goalRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when category does not exist")
        void createGoal_CategoryNotFound_ThrowsException() {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Title", "Milestone", null, null, categoryId, false, null, null, null
            );
            when(categoryRepository.existsById(categoryId)).thenReturn(false);

            assertThatThrownBy(() -> goalService.createGoal(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid category ID");

            verify(goalRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should successfully create non-binary goal when category is valid")
        void createGoal_ValidCategory_Success() {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Learn Java", "Milestone", LocalDate.now(), LocalDate.now().plusDays(10),
                    categoryId, false, null, null, null
            );

            when(categoryRepository.existsById(categoryId)).thenReturn(true);
            when(goalMapper.toEntity(request)).thenReturn(sampleGoal);
            when(goalRepository.save(sampleGoal)).thenReturn(sampleGoal);
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(goalMapper.toDto(sampleGoal)).thenReturn(sampleGoalDto);

            GoalDto result = goalService.createGoal(request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleGoal.getUserId()).isEqualTo(userId);
            assertThat(sampleGoal.getStatus()).isEqualTo("In Progress");
            assertThat(sampleGoal.getProgressPct()).isEqualTo(0);

            verify(goalRepository, times(1)).save(sampleGoal);
            verify(goalMapper, times(1)).toDto(sampleGoal);
        }

        @Test
        @DisplayName("Should recalculate binary goal progress on creation when goalType is Binary")
        void createGoal_BinaryGoal_SuccessWithProgressRecalculation() {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Read Book", "Binary", LocalDate.now(), LocalDate.now().plusDays(10),
                    categoryId, false, null, null, null
            );

            Goal binaryGoal = new Goal();
            binaryGoal.setId(goalId);
            binaryGoal.setUserId(userId);
            binaryGoal.setGoalType("Binary");
            binaryGoal.setCategoryId(categoryId);

            when(categoryRepository.existsById(categoryId)).thenReturn(true);
            when(goalMapper.toEntity(request)).thenReturn(binaryGoal);
            when(goalRepository.save(binaryGoal)).thenReturn(binaryGoal);
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(binaryGoal));
            when(taskRepository.countByGoalId(goalId)).thenReturn(2L);
            when(taskRepository.countByGoalIdAndStatus(goalId, "Done")).thenReturn(2L);
            when(goalMapper.toDto(binaryGoal)).thenReturn(sampleGoalDto);

            GoalDto result = goalService.createGoal(request, userId);

            assertThat(result).isNotNull();
            assertThat(binaryGoal.getProgressPct()).isEqualTo(100);
            assertThat(binaryGoal.getStatus()).isEqualTo("Done");
            verify(goalRepository, times(2)).save(binaryGoal);
        }
    }

    @Nested
    @DisplayName("updateGoal Tests")
    class UpdateGoalTests {

        @Test
        @DisplayName("Should throw GoalNotFoundException when goal does not exist")
        void updateGoal_GoalNotFound_ThrowsException() {
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "In Progress", null, null, categoryId, false, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> goalService.updateGoal(goalId, request, userId))
                    .isInstanceOf(GoalNotFoundException.class)
                    .hasMessage("Goal not found");
        }

        @Test
        @DisplayName("Should throw GoalNotFoundException when goal belongs to another user")
        void updateGoal_BelongsToAnotherUser_ThrowsException() {
            UUID otherUser = UUID.randomUUID();
            sampleGoal.setUserId(otherUser);
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "In Progress", null, null, categoryId, false, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> goalService.updateGoal(goalId, request, userId))
                    .isInstanceOf(GoalNotFoundException.class)
                    .hasMessage("Goal not found");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when updated categoryId does not exist")
        void updateGoal_InvalidCategory_ThrowsException() {
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "In Progress", null, null, categoryId, false, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(categoryRepository.existsById(categoryId)).thenReturn(false);

            assertThatThrownBy(() -> goalService.updateGoal(goalId, request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid category ID");
        }

        @Test
        @DisplayName("Should throw GoalLimitExceededException when activating goal and active count >= 5")
        void updateGoal_LimitExceeded_ThrowsException() {
            sampleGoal.setStatus("Freeze");
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "In Progress", null, null, categoryId, false, null, null, null
            );

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(categoryRepository.existsById(categoryId)).thenReturn(true);
            when(goalRepository.countByUserIdAndStatus(userId, "In Progress")).thenReturn(5);

            assertThatThrownBy(() -> goalService.updateGoal(goalId, request, userId))
                    .isInstanceOf(GoalLimitExceededException.class)
                    .hasMessage("Bạn chỉ được phép có tối đa 5 Goal đang In Progress.");
        }

        @Test
        @DisplayName("Should successfully update goal when activating and active count < 5")
        void updateGoal_ActivateWithCountLessThan5_Success() {
            sampleGoal.setStatus("Freeze");
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "In Progress", null, null, categoryId, false, null, null, null
            );

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(categoryRepository.existsById(categoryId)).thenReturn(true);
            when(goalRepository.countByUserIdAndStatus(userId, "In Progress")).thenReturn(4);
            when(goalRepository.save(sampleGoal)).thenReturn(sampleGoal);
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(goalMapper.toDto(sampleGoal)).thenReturn(sampleGoalDto);

            GoalDto result = goalService.updateGoal(goalId, request, userId);

            assertThat(result).isNotNull();
            verify(goalMapper, times(1)).updateFromRequest(request, sampleGoal);
            verify(goalRepository, times(1)).save(sampleGoal);
        }

        @Test
        @DisplayName("Should update goal status to Freeze without trigger limit check")
        void updateGoal_FreezeStatus_Success() {
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "New Title", "Freeze", null, null, categoryId, false, null, null, null
            );

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(categoryRepository.existsById(categoryId)).thenReturn(true);
            when(goalRepository.save(sampleGoal)).thenReturn(sampleGoal);
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(goalMapper.toDto(sampleGoal)).thenReturn(sampleGoalDto);

            GoalDto result = goalService.updateGoal(goalId, request, userId);

            assertThat(result).isNotNull();
            verify(goalRepository, never()).countByUserIdAndStatus(any(), any());
            verify(goalRepository, times(1)).save(sampleGoal);
        }
    }

    @Nested
    @DisplayName("deleteGoal Tests")
    class DeleteGoalTests {

        @Test
        @DisplayName("Should throw GoalNotFoundException when goal does not exist")
        void deleteGoal_NotFound_ThrowsException() {
            when(goalRepository.findById(goalId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> goalService.deleteGoal(goalId, userId))
                    .isInstanceOf(GoalNotFoundException.class)
                    .hasMessage("Goal not found");
        }

        @Test
        @DisplayName("Should archive goal when goal has associated tasks")
        void deleteGoal_HasTasks_SoftArchive() {
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.existsByGoalId(goalId)).thenReturn(true);

            goalService.deleteGoal(goalId, userId);

            assertThat(sampleGoal.getStatus()).isEqualTo("Archived");
            verify(goalRepository, times(1)).save(sampleGoal);
            verify(goalRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Should physically delete goal when goal has no tasks")
        void deleteGoal_NoTasks_HardDelete() {
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.existsByGoalId(goalId)).thenReturn(false);

            goalService.deleteGoal(goalId, userId);

            verify(goalRepository, times(1)).delete(sampleGoal);
            verify(goalRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateGoalProgress Tests")
    class UpdateGoalProgressTests {

        @Test
        @DisplayName("Should do nothing when goalId is null")
        void updateGoalProgress_NullGoalId_NoOp() {
            goalService.updateGoalProgress(null);
            verify(goalRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Should do nothing when goal does not exist")
        void updateGoalProgress_GoalNotFound_NoOp() {
            when(goalRepository.findById(goalId)).thenReturn(Optional.empty());

            goalService.updateGoalProgress(goalId);

            verify(goalRepository, times(1)).findById(goalId);
            verify(goalRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should update status to Done for non-binary goal when progress is >= 100%")
        void updateGoalProgress_NonBinary_Progress100_MarkedDone() {
            sampleGoal.setGoalType("Milestone");
            sampleGoal.setProgressPct(100);

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            goalService.updateGoalProgress(goalId);

            assertThat(sampleGoal.getStatus()).isEqualTo("Done");
            verify(goalRepository, times(1)).save(sampleGoal);
        }

        @Test
        @DisplayName("Should keep status unchanged for non-binary goal when progress is < 100%")
        void updateGoalProgress_NonBinary_ProgressLessThan100_SaveOnly() {
            sampleGoal.setGoalType("Milestone");
            sampleGoal.setStatus("In Progress");
            sampleGoal.setProgressPct(50);

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            goalService.updateGoalProgress(goalId);

            assertThat(sampleGoal.getStatus()).isEqualTo("In Progress");
            verify(goalRepository, times(1)).save(sampleGoal);
        }

        @Test
        @DisplayName("Should set progressPct to 0 when binary goal has 0 tasks")
        void updateGoalProgress_Binary_NoTasks_ProgressPct0() {
            sampleGoal.setGoalType("Binary");
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.countByGoalId(goalId)).thenReturn(0L);

            goalService.updateGoalProgress(goalId);

            assertThat(sampleGoal.getProgressPct()).isEqualTo(0);
            verify(goalRepository, times(1)).save(sampleGoal);
        }

        @Test
        @DisplayName("Should calculate progressPct correctly and set status to Done when all tasks completed")
        void updateGoalProgress_Binary_AllTasksDone_StatusDone() {
            sampleGoal.setGoalType("Binary");
            sampleGoal.setStatus("In Progress");

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.countByGoalId(goalId)).thenReturn(4L);
            when(taskRepository.countByGoalIdAndStatus(goalId, "Done")).thenReturn(4L);

            goalService.updateGoalProgress(goalId);

            assertThat(sampleGoal.getProgressPct()).isEqualTo(100);
            assertThat(sampleGoal.getStatus()).isEqualTo("Done");
            verify(goalRepository, times(1)).save(sampleGoal);
        }

        @Test
        @DisplayName("Should revert status from Done to In Progress if binary goal is incomplete")
        void updateGoalProgress_Binary_RevertFromDoneToInProgress() {
            sampleGoal.setGoalType("Binary");
            sampleGoal.setStatus("Done");

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.countByGoalId(goalId)).thenReturn(4L);
            when(taskRepository.countByGoalIdAndStatus(goalId, "Done")).thenReturn(2L);

            goalService.updateGoalProgress(goalId);

            assertThat(sampleGoal.getProgressPct()).isEqualTo(50);
            assertThat(sampleGoal.getStatus()).isEqualTo("In Progress");
            verify(goalRepository, times(1)).save(sampleGoal);
        }
    }
}
