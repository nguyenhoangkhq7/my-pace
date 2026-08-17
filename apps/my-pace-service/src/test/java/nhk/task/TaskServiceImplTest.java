package nhk.task;

import jakarta.persistence.EntityNotFoundException;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.goal.GoalService;
import nhk.planning.DailyPlanTaskRepository;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private GoalService goalService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    @Mock
    private TaskTimeBlockRepository timeBlockRepository;

    @Mock
    private nhk.category.CategoryRepository categoryRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private TaskServiceImpl taskService;

    private UUID userId;
    private UUID goalId;
    private UUID taskId;
    private UUID checklistId;
    private Task sampleTask;
    private TaskDto sampleTaskDto;
    private Goal sampleGoal;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        goalId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        checklistId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("Asia/Ho_Chi_Minh");

        sampleGoal = new Goal();
        sampleGoal.setId(goalId);
        sampleGoal.setUserId(userId);
        sampleGoal.setStatus("In Progress");

        sampleTask = new Task();
        sampleTask.setId(taskId);
        sampleTask.setUserId(userId);
        sampleTask.setTitle("Test Task");
        sampleTask.setStatus("Backlog");
        sampleTask.setActualMinutes(0);
        sampleTask.setChecklists(new ArrayList<>());

        sampleTaskDto = TaskDto.builder()
                .id(taskId)
                .userId(userId)
                .title("Test Task")
                .status("Backlog")
                .actualMinutes(0)
                .checklists(List.of())
                .build();
    }

    @Nested
    @DisplayName("getTasks Tests")
    class GetTasksTests {

        @Test
        @DisplayName("Should return list of TaskDto when user has tasks")
        void getTasks_Success() {
            when(taskRepository.findByUserId(userId)).thenReturn(List.of(sampleTask));
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            List<TaskDto> result = taskService.getTasks(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(taskId);
            verify(taskRepository, times(1)).findByUserId(userId);
        }

        @Test
        @DisplayName("Should return empty list when user has no tasks")
        void getTasks_Empty() {
            when(taskRepository.findByUserId(userId)).thenReturn(List.of());

            List<TaskDto> result = taskService.getTasks(userId);

            assertThat(result).isEmpty();
            verify(taskRepository, times(1)).findByUserId(userId);
        }
    }

    @Nested
    @DisplayName("createTask Tests")
    class CreateTaskTests {

        @Test
        @DisplayName("Should throw EntityNotFoundException when goalId is provided but goal is not found")
        void createTask_GoalNotFound_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, null, null, null, null, null, null, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Goal not found");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when goal belongs to another user")
        void createTask_GoalBelongsToOtherUser_ThrowsException() {
            UUID otherUser = UUID.randomUUID();
            sampleGoal.setUserId(otherUser);
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, null, null, null, null, null, null, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Goal not found");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when goal status is Freeze")
        void createTask_GoalFreeze_ThrowsException() {
            sampleGoal.setStatus("Freeze");
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, null, null, null, null, null, null, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Chỉ có thể liên kết Task với Goal đang ở trạng thái In Progress.");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when goal status is Archived")
        void createTask_GoalArchived_ThrowsException() {
            sampleGoal.setStatus("Archived");
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, null, null, null, null, null, null, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Chỉ có thể liên kết Task với Goal đang ở trạng thái In Progress.");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when goal status is Done")
        void createTask_GoalDone_ThrowsException() {
            sampleGoal.setStatus("Done");
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, null, null, null, null, null, null, null, null, null
            );
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Chỉ có thể liên kết Task với Goal đang ở trạng thái In Progress.");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when splittable task has estimatedMinutes < 15")
        void createTask_SplittableEstLessThan15_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 10, null, null, true, 15, null, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Thời gian ước tính phải từ 15 phút trở lên mới có thể chia nhỏ.");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when splittable task has minChunk < 15")
        void createTask_SplittableMinChunkLessThan15_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 60, null, null, true, 10, null, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Thời lượng 1 block tối thiểu phải từ 15 phút.");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when splittable task has minChunk > estimatedMinutes")
        void createTask_SplittableMinChunkGreaterThanEst_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 30, null, null, true, 45, null, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Thời lượng 1 block (45m) không được lớn hơn tổng thời gian công việc (30m).");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when splittable task has maxDaily > 720")
        void createTask_SplittableMaxDailyGreaterThan720_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 800, null, null, true, 30, 800, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Thời lượng tối đa 1 ngày không được vượt quá 12 tiếng (720 phút).");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when splittable task has maxDaily < minChunk")
        void createTask_SplittableMaxDailyLessThanMinChunk_ThrowsException() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 120, null, null, true, 60, 30, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Thời lượng tối đa 1 ngày (30m) không được nhỏ hơn thời lượng 1 block (60m).");
        }

        @Test
        @DisplayName("Should set default values and status Backlog when not provided")
        void createTask_WithoutGoal_DefaultValues_Success() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 30, null, null, null, null, null, null, null, null, null
            );

            Task entityToSave = new Task();
            entityToSave.setTitle("Task Title");
            entityToSave.setChecklists(new ArrayList<>());

            when(taskMapper.toEntity(request)).thenReturn(entityToSave);
            when(taskRepository.save(entityToSave)).thenReturn(entityToSave);
            when(taskMapper.toDto(entityToSave)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.createTask(request, userId);

            assertThat(result).isNotNull();
            assertThat(entityToSave.getUserId()).isEqualTo(userId);
            assertThat(entityToSave.getIsUrgent()).isFalse();
            assertThat(entityToSave.getIsImportant()).isFalse();
            assertThat(entityToSave.getIsSplittable()).isFalse();
            assertThat(entityToSave.getStatus()).isEqualTo("Backlog");
            verify(taskRepository, times(1)).save(entityToSave);
            verify(goalService, never()).updateGoalProgress(any());
        }

        @Test
        @DisplayName("Should create task with custom status and goal progress update")
        void createTask_WithGoalAndCustomStatus_Success() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", goalId, null, 30, true, true, true, 15, 60,
                    LocalDateTime.now(), "Picked for Today", "Notes", null
            );

            Task entityToSave = new Task();
            entityToSave.setTitle("Task Title");
            entityToSave.setGoalId(goalId);
            entityToSave.setIsUrgent(true);
            entityToSave.setIsImportant(true);
            entityToSave.setIsSplittable(true);
            entityToSave.setChecklists(new ArrayList<>());

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskMapper.toEntity(request)).thenReturn(entityToSave);
            when(taskRepository.save(entityToSave)).thenReturn(entityToSave);
            when(taskMapper.toDto(entityToSave)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.createTask(request, userId);

            assertThat(result).isNotNull();
            assertThat(entityToSave.getStatus()).isEqualTo("Picked for Today");
            verify(goalService, times(1)).updateGoalProgress(goalId);
        }

        @Test
        @DisplayName("Should auto-inherit goal categoryId when creating task with goalId")
        void createTask_WithGoal_InheritsGoalCategoryId() {
            UUID goalCategoryId = UUID.randomUUID();
            sampleGoal.setCategoryId(goalCategoryId);

            TaskCreateRequest request = new TaskCreateRequest(
                    "Goal Task", goalId, null, 30, false, true, false, null, null,
                    null, "Backlog", null, null
            );

            Task entityToSave = new Task();
            entityToSave.setTitle("Goal Task");
            entityToSave.setGoalId(goalId);
            entityToSave.setChecklists(new ArrayList<>());

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskMapper.toEntity(request)).thenReturn(entityToSave);
            when(taskRepository.save(entityToSave)).thenReturn(entityToSave);
            when(taskMapper.toDto(entityToSave)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.createTask(request, userId);

            assertThat(result).isNotNull();
            assertThat(entityToSave.getCategoryId()).isEqualTo(goalCategoryId);
        }

        @Test
        @DisplayName("Should create task with checklists when checklist items are present in request")
        void createTask_WithChecklists_Success() {
            TaskChecklistItemRequest chkReq1 = new TaskChecklistItemRequest(null, "Subtask 1", false, 0);
            TaskChecklistItemRequest chkReq2 = new TaskChecklistItemRequest(null, "Subtask 2", true, 1);
            TaskChecklistItemRequest chkReqEmpty = new TaskChecklistItemRequest(null, "   ", false, 2);

            TaskCreateRequest request = new TaskCreateRequest(
                    "Task Title", null, null, 30, null, null, null, null, null, null, null, null,
                    List.of(chkReq1, chkReq2, chkReqEmpty)
            );

            Task entityToSave = new Task();
            entityToSave.setTitle("Task Title");
            entityToSave.setChecklists(new ArrayList<>());

            when(taskMapper.toEntity(request)).thenReturn(entityToSave);
            when(taskRepository.save(entityToSave)).thenReturn(entityToSave);
            when(taskMapper.toDto(entityToSave)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.createTask(request, userId);

            assertThat(result).isNotNull();
            assertThat(entityToSave.getChecklists()).hasSize(2);
            assertThat(entityToSave.getChecklists().get(0).getTitle()).isEqualTo("Subtask 1");
            assertThat(entityToSave.getChecklists().get(1).getTitle()).isEqualTo("Subtask 2");
            assertThat(entityToSave.getChecklists().get(1).getIsCompleted()).isTrue();
            verify(taskRepository, times(2)).save(entityToSave);
        }
    }

    @Nested
    @DisplayName("updateTask Tests")
    class UpdateTaskTests {

        @Test
        @DisplayName("Should throw EntityNotFoundException when task does not exist")
        void updateTask_NotFound_ThrowsException() {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "New Title", null, null, 30, 0, false, false, false, null, null, "Backlog", null, null, null
            , null, null, null);
            when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(taskId, request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Task not found");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when task belongs to another user")
        void updateTask_BelongsToOtherUser_ThrowsException() {
            UUID otherUser = UUID.randomUUID();
            sampleTask.setUserId(otherUser);
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "New Title", null, null, 30, 0, false, false, false, null, null, "Backlog", null, null, null
            , null, null, null);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            assertThatThrownBy(() -> taskService.updateTask(taskId, request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Task not found");
        }

        @Test
        @DisplayName("Should clear fields when clear flags are true")
        void updateTask_ClearFlags_SetsFieldsToNull() {
            sampleTask.setDueDate(LocalDateTime.now());
            sampleTask.setGoalId(UUID.randomUUID());
            sampleTask.setCategoryId(UUID.randomUUID());

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "New Title", null, null, 30, 0, false, false, false, null, null, "Backlog", null, null, null, true, true, true
            );

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> null).when(taskMapper).updateFromRequest(request, sampleTask);
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            taskService.updateTask(taskId, request, userId);

            assertThat(sampleTask.getDueDate()).isNull();
            assertThat(sampleTask.getGoalId()).isNull();
            assertThat(sampleTask.getCategoryId()).isNull();
        }

        @Test
        @DisplayName("Should validate goal if new goalId provided in request")
        void updateTask_InvalidGoal_ThrowsException() {
            sampleGoal.setStatus("Freeze");
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "New Title", goalId, null, 30, 0, false, false, false, null, null, "Backlog", null, null, null
            , null, null, null);
            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));

            assertThatThrownBy(() -> taskService.updateTask(taskId, request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Chỉ có thể liên kết Task với Goal đang ở trạng thái In Progress.");
        }

        @Test
        @DisplayName("Should set doneAt with User timezone when transitioning to Done")
        void updateTask_TransitionToDone_SetsDoneAtWithUserTimezone() {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Done Title", null, null, 30, 30, false, false, false, null, null, "Done", null, null, null
            , null, null, null);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setStatus("Done");
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.updateTask(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleTask.getDoneAt()).isNotNull();
            verify(userRepository, times(1)).findById(userId);
        }

        @Test
        @DisplayName("Should fallback to UTC timezone when user timezone is blank")
        void updateTask_TransitionToDone_UserTimezoneBlank_FallbackUTC() {
            sampleUser.setTimezone("");
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Done Title", null, null, 30, 30, false, false, false, null, null, "Done", null, null, null
            , null, null, null);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setStatus("Done");
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.updateTask(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleTask.getDoneAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw UserNotFoundException if user is not found when transitioning to Done")
        void updateTask_TransitionToDone_UserNotFound_ThrowsException() {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Done Title", null, null, 30, 30, false, false, false, null, null, "Done", null, null, null
            , null, null, null);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setStatus("Done");
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(taskId, request, userId))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("User not found");
        }

        @Test
        @DisplayName("Should clear doneAt when transitioning from Done to another status")
        void updateTask_TransitionFromDoneToBacklog_ClearsDoneAt() {
            sampleTask.setStatus("Done");
            sampleTask.setDoneAt(OffsetDateTime.now());

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Backlog Title", null, null, 30, 0, false, false, false, null, null, "Backlog", null, null, null
            , null, null, null);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setStatus("Backlog");
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.updateTask(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleTask.getDoneAt()).isNull();
        }

        @Test
        @DisplayName("Should update goal progress when task remains Done but actualMinutes changed")
        void updateTask_RemainDone_ActualMinutesChanged_UpdatesGoalProgress() {
            sampleTask.setGoalId(goalId);
            sampleTask.setStatus("Done");
            sampleTask.setActualMinutes(30);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Done Title", goalId, null, 30, 45, false, false, false, null, null, "Done", null, null, null
            , null, null, null);

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setActualMinutes(45);
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            taskService.updateTask(taskId, request, userId);

            verify(goalService, times(1)).updateGoalProgress(goalId);
        }

        @Test
        @DisplayName("Should auto-inherit goal categoryId when updating task with goalId")
        void updateTask_WithGoal_InheritsGoalCategoryId() {
            UUID goalCategoryId = UUID.randomUUID();
            sampleGoal.setCategoryId(goalCategoryId);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Updated Title", goalId, null, 30, 0, false, false, false, null, null, "Backlog", null, null,
                    null, null, null, null
            );

            when(goalRepository.findById(goalId)).thenReturn(Optional.of(sampleGoal));
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setGoalId(goalId);
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.updateTask(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleTask.getCategoryId()).isEqualTo(goalCategoryId);
        }

        @Test
        @DisplayName("Should update checklists inline during task update")
        void updateTask_WithChecklistUpdates_Success() {
            TaskChecklistItem existingItem = new TaskChecklistItem();
            existingItem.setId(checklistId);
            existingItem.setTaskId(taskId);
            existingItem.setTask(sampleTask);
            existingItem.setTitle("Old Title");
            existingItem.setIsCompleted(false);
            existingItem.setOrderIndex(0);

            sampleTask.getChecklists().add(existingItem);

            TaskChecklistItemRequest updateExistingReq = new TaskChecklistItemRequest(checklistId, "Updated Title", true, 0);
            TaskChecklistItemRequest newReq = new TaskChecklistItemRequest(null, "Brand New Subtask", false, 1);
            TaskChecklistItemRequest emptyReq = new TaskChecklistItemRequest(null, "", false, 2);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Title", null, null, 30, 0, false, false, false, null, null, "Backlog", null, null,
                    List.of(updateExistingReq, newReq, emptyReq), null, null, null
            );

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            taskService.updateTask(taskId, request, userId);

            assertThat(sampleTask.getChecklists()).hasSize(2);
            assertThat(sampleTask.getChecklists().get(0).getTitle()).isEqualTo("Updated Title");
            assertThat(sampleTask.getChecklists().get(0).getIsCompleted()).isTrue();
            assertThat(sampleTask.getChecklists().get(1).getTitle()).isEqualTo("Brand New Subtask");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when title is blank")
        void updateTask_BlankTitle_ThrowsException() {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "   ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.updateTask(taskId, request, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Title cannot be blank");
        }

        @Test
        @DisplayName("Should successfully update task when title is null and preserve existing title")
        void updateTask_PartialUpdate_PreservesExistingTitle() {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    null, null, null, null, null, false, true, null, null, null, null, null, null, null, null, null, null
            );

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            doAnswer(invocation -> {
                sampleTask.setIsUrgent(false);
                sampleTask.setIsImportant(true);
                return null;
            }).when(taskMapper).updateFromRequest(request, sampleTask);
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);
            when(taskMapper.toDto(sampleTask)).thenReturn(sampleTaskDto);

            TaskDto result = taskService.updateTask(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(sampleTask.getTitle()).isEqualTo("Test Task");
            assertThat(sampleTask.getIsUrgent()).isFalse();
            assertThat(sampleTask.getIsImportant()).isTrue();
            verify(taskRepository, times(1)).save(sampleTask);
        }
    }

    @Nested
    @DisplayName("deleteTask Tests")
    class DeleteTaskTests {

        @Test
        @DisplayName("Should throw EntityNotFoundException when task to delete does not exist")
        void deleteTask_NotFound_ThrowsException() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.deleteTask(taskId, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Task not found");
        }

        @Test
        @DisplayName("Should delete dailyPlanTasks, timeBlocks, task and update goal progress if goalId present")
        void deleteTask_WithGoal_Success() {
            sampleTask.setGoalId(goalId);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            taskService.deleteTask(taskId, userId);

            verify(dailyPlanTaskRepository, times(1)).deleteByTaskId(taskId);
            verify(timeBlockRepository, times(1)).deleteByTaskId(taskId);
            verify(taskRepository, times(1)).delete(sampleTask);
            verify(goalService, times(1)).updateGoalProgress(goalId);
        }

        @Test
        @DisplayName("Should delete task without updating goal progress if goalId is null")
        void deleteTask_WithoutGoal_Success() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            taskService.deleteTask(taskId, userId);

            verify(dailyPlanTaskRepository, times(1)).deleteByTaskId(taskId);
            verify(timeBlockRepository, times(1)).deleteByTaskId(taskId);
            verify(taskRepository, times(1)).delete(sampleTask);
            verify(goalService, never()).updateGoalProgress(any());
        }
    }

    @Nested
    @DisplayName("Checklist Operations Tests")
    class ChecklistOperationsTests {

        @Test
        @DisplayName("addChecklistItem should add item and return TaskChecklistItemDto")
        void addChecklistItem_Success() {
            TaskChecklistItemRequest request = new TaskChecklistItemRequest(null, "New Item", false, null);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);

            TaskChecklistItemDto result = taskService.addChecklistItem(taskId, request, userId);

            assertThat(result).isNotNull();
            assertThat(result.title()).isEqualTo("New Item");
            assertThat(sampleTask.getChecklists()).hasSize(1);
            verify(taskRepository, times(1)).save(sampleTask);
        }

        @Test
        @DisplayName("updateChecklistItem should throw EntityNotFoundException when item not found")
        void updateChecklistItem_ItemNotFound_ThrowsException() {
            TaskChecklistItemRequest request = new TaskChecklistItemRequest(checklistId, "Updated", true, 0);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            assertThatThrownBy(() -> taskService.updateChecklistItem(taskId, checklistId, request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("Checklist item not found");
        }

        @Test
        @DisplayName("updateChecklistItem should update title, isCompleted, orderIndex")
        void updateChecklistItem_Success() {
            TaskChecklistItem item = new TaskChecklistItem();
            item.setId(checklistId);
            item.setTaskId(taskId);
            item.setTitle("Old Title");
            item.setIsCompleted(false);
            item.setOrderIndex(0);

            sampleTask.getChecklists().add(item);

            TaskChecklistItemRequest request = new TaskChecklistItemRequest(checklistId, "Updated Title", true, 2);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);

            TaskChecklistItemDto result = taskService.updateChecklistItem(taskId, checklistId, request, userId);

            assertThat(result).isNotNull();
            assertThat(result.title()).isEqualTo("Updated Title");
            assertThat(result.isCompleted()).isTrue();
            assertThat(result.orderIndex()).isEqualTo(2);
            verify(taskRepository, times(1)).save(sampleTask);
        }

        @Test
        @DisplayName("deleteChecklistItem should remove item and save task if item was found")
        void deleteChecklistItem_ItemFound_Success() {
            TaskChecklistItem item = new TaskChecklistItem();
            item.setId(checklistId);

            sampleTask.getChecklists().add(item);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);

            taskService.deleteChecklistItem(taskId, checklistId, userId);

            assertThat(sampleTask.getChecklists()).isEmpty();
            verify(taskRepository, times(1)).save(sampleTask);
        }

        @Test
        @DisplayName("deleteChecklistItem should do nothing if item was not found")
        void deleteChecklistItem_ItemNotFound_NoOp() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            taskService.deleteChecklistItem(taskId, checklistId, userId);

            verify(taskRepository, never()).save(any());
        }

        @Test
        @DisplayName("reorderChecklists should update order indexes based on list order")
        void reorderChecklists_Success() {
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();

            TaskChecklistItem item1 = new TaskChecklistItem();
            item1.setId(id1);
            item1.setOrderIndex(0);

            TaskChecklistItem item2 = new TaskChecklistItem();
            item2.setId(id2);
            item2.setOrderIndex(1);

            sampleTask.getChecklists().addAll(List.of(item1, item2));

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(taskRepository.save(sampleTask)).thenReturn(sampleTask);

            // Reorder id2 to index 0, id1 to index 1
            taskService.reorderChecklists(taskId, List.of(id2, id1), userId);

            assertThat(item2.getOrderIndex()).isEqualTo(0);
            assertThat(item1.getOrderIndex()).isEqualTo(1);
            verify(taskRepository, times(1)).save(sampleTask);
        }
    }
}
