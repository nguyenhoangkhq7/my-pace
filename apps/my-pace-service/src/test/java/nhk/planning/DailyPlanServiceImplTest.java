package nhk.planning;

import jakarta.persistence.EntityNotFoundException;
import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.goal.GoalService;
import nhk.task.Task;
import nhk.task.TaskDto;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import nhk.scheduling.AutoScheduleService;

class DailyPlanServiceImplTest {

    private DailyPlanRepository dailyPlanRepository;
    private DailyPlanTaskRepository dailyPlanTaskRepository;
    private TaskRepository taskRepository;
    private DailyPlanMapper dailyPlanMapper;
    private TaskTimeBlockRepository timeBlockRepository;
    private GoalService goalService;
    private UserRepository userRepo;
    private GoalRepository goalRepository;
    private FixedEventService eventService;
    private AutoScheduleService autoScheduleService;

    private DailyPlanServiceImpl dailyPlanService;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate planDate = LocalDate.of(2026, 8, 2);
    private User user;

    @BeforeEach
    void setUp() {
        dailyPlanRepository = mock(DailyPlanRepository.class);
        dailyPlanTaskRepository = mock(DailyPlanTaskRepository.class);
        taskRepository = mock(TaskRepository.class);
        dailyPlanMapper = mock(DailyPlanMapper.class);
        timeBlockRepository = mock(TaskTimeBlockRepository.class);
        goalService = mock(GoalService.class);
        userRepo = mock(UserRepository.class);
        goalRepository = mock(GoalRepository.class);
        eventService = mock(FixedEventService.class);
        autoScheduleService = mock(AutoScheduleService.class);

        dailyPlanService = new DailyPlanServiceImpl(
                dailyPlanRepository,
                dailyPlanTaskRepository,
                taskRepository,
                dailyPlanMapper,
                timeBlockRepository,
                goalService,
                userRepo,
                goalRepository,
                eventService,
                autoScheduleService
        );

        user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
    }

    // --- getDailyPlan ---

    @Test
    @DisplayName("getDailyPlan returns mapped Dto when plan exists")
    void testGetDailyPlan_Found() {
        DailyPlan plan = new DailyPlan();
        UUID planId = UUID.randomUUID();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);

        DailyPlanDto baseDto = DailyPlanDto.builder()
                .id(planId)
                .userId(userId)
                .planDate(planDate)
                .build();

        DailyPlanTask planTask = new DailyPlanTask();
        planTask.setId(UUID.randomUUID());
        planTask.setDailyPlanId(planId);

        DailyPlanTaskDto taskDto = new DailyPlanTaskDto(planTask.getId(), planId, mock(TaskDto.class), true, 1);

        TaskTimeBlock timeBlock = new TaskTimeBlock();
        timeBlock.setId(UUID.randomUUID());
        timeBlock.setTaskId(UUID.randomUUID());
        timeBlock.setTaskId(UUID.randomUUID());
        timeBlock.setStartTime(LocalDateTime.of(planDate, LocalTime.of(9, 0)));
        timeBlock.setEndTime(LocalDateTime.of(planDate, LocalTime.of(10, 0)));
        timeBlock.setPartIndex(1);
        timeBlock.setTotalParts(1);
        timeBlock.setActualMinutes(60);
        timeBlock.setIsCompleted(false);
        timeBlock.setAvailabilityStatus("FREE");

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(planId)).thenReturn(List.of(planTask));
        when(dailyPlanMapper.toDto(planTask)).thenReturn(taskDto);
        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of(timeBlock));

        DailyPlanDto result = dailyPlanService.getDailyPlan(planDate, userId);

        assertNotNull(result);
        assertEquals(planId, result.id());
        assertEquals(1, result.tasks().size());
    }

    @Test
    @DisplayName("getDailyPlan returns null when plan does not exist")
    void testGetDailyPlan_NotFound() {
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        DailyPlanDto result = dailyPlanService.getDailyPlan(planDate, userId);
        assertNull(result);
    }

    // --- getDailyPlansInRange ---

    @Test
    @DisplayName("getDailyPlansInRange returns list of mapped Dtos")
    void testGetDailyPlansInRange() {
        LocalDate startDate = planDate;
        LocalDate endDate = planDate.plusDays(2);

        DailyPlan plan = new DailyPlan();
        UUID planId = UUID.randomUUID();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).userId(userId).planDate(planDate).build();

        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(userId, startDate, endDate))
                .thenReturn(List.of(plan));
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(planId)).thenReturn(List.of());
        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of());

        List<DailyPlanDto> results = dailyPlanService.getDailyPlansInRange(startDate, endDate, userId);

        assertEquals(1, results.size());
        assertEquals(planId, results.get(0).id());
    }

    // --- planMyDay ---

    @Test
    @DisplayName("planMyDay creates new plan, syncs tasks, and handles removed tasks")
    void testPlanMyDay_CreatesPlanAndSyncsTasks() {
        UUID taskId1 = UUID.randomUUID();
        UUID taskId2 = UUID.randomUUID();

        Task task1 = new Task();
        task1.setId(taskId1);
        task1.setUserId(userId);
        task1.setStatus("Backlog");

        Task task2 = new Task();
        task2.setId(taskId2);
        task2.setUserId(userId);
        task2.setStatus("Picked for Today");
        task2.setGoalId(UUID.randomUUID());
        task2.setEstimatedMinutes(30);

        Goal goal = new Goal();
        goal.setId(task2.getGoalId());
        goal.setPreferTime(LocalTime.of(14, 0));

        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);

        // Existing plan task that will be removed
        Task oldTask = new Task();
        oldTask.setId(UUID.randomUUID());
        oldTask.setStatus("Picked for Today");

        DailyPlanTask oldPlanTask = new DailyPlanTask();
        oldPlanTask.setDailyPlanId(planId);
        oldPlanTask.setTask(oldTask);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(dailyPlanRepository.save(any(DailyPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(planId)).thenReturn(List.of(oldPlanTask));

        when(taskRepository.findById(taskId1)).thenReturn(Optional.of(task1));
        when(taskRepository.findById(taskId2)).thenReturn(Optional.of(task2));
        when(goalRepository.findById(task2.getGoalId())).thenReturn(Optional.of(goal));
        when(timeBlockRepository.findByTaskId(taskId2)).thenReturn(List.of());
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(userId, planDate, planDate)).thenReturn(List.of());
        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of());

        PlanMyDayRequest request = new PlanMyDayRequest(
                planDate,
                120,
                List.of(
                        new PlanMyDayRequest.PlanTaskItem(taskId1, true, 1),
                        new PlanMyDayRequest.PlanTaskItem(taskId2, false, 2)
                )
        );

        DailyPlanDto expectedDto = DailyPlanDto.builder().id(planId).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(expectedDto);

        DailyPlanDto result = dailyPlanService.planMyDay(request, userId);

        // Verify old task status reset to Backlog
        assertEquals("Backlog", oldTask.getStatus());
        verify(taskRepository).save(oldTask);

        // Verify new task statuses updated to "Picked for Today"
        assertEquals("Picked for Today", task1.getStatus());
        assertEquals("Picked for Today", task2.getStatus());
        verify(taskRepository).save(task1);
        verify(taskRepository).save(task2);

        // Verify timeblock auto-scheduled for task2 with preferTime
        verify(timeBlockRepository).save(any(TaskTimeBlock.class));

        assertNotNull(result);
    }

    @Test
    @DisplayName("planMyDay throws EntityNotFoundException if task does not exist or belong to user")
    void testPlanMyDay_TaskNotFound_ThrowsException() {
        UUID taskId = UUID.randomUUID();
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        when(dailyPlanRepository.save(any())).thenAnswer(inv -> {
            DailyPlan p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(any())).thenReturn(List.of());
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        PlanMyDayRequest request = new PlanMyDayRequest(
                planDate, 60, List.of(new PlanMyDayRequest.PlanTaskItem(taskId, false, 1))
        );

        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.planMyDay(request, userId));
    }

    // --- confirmPlan & unconfirmPlan ---

    @Test
    @DisplayName("confirmPlan sets isConfirmed to true and updates time blocks to BUSY")
    void testConfirmPlan_Success() {
        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);
        plan.setIsConfirmed(false);

        TaskTimeBlock block = new TaskTimeBlock();
        block.setId(UUID.randomUUID());
        block.setAvailabilityStatus("FREE");

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of(block));

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).isConfirmed(true).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);

        DailyPlanDto result = dailyPlanService.confirmPlan(planDate, userId);

        assertTrue(plan.getIsConfirmed());
        assertNotNull(plan.getConfirmedAt());
        assertEquals("BUSY", block.getAvailabilityStatus());
        verify(dailyPlanRepository).save(plan);
        verify(timeBlockRepository).saveAll(List.of(block));
        assertNotNull(result);
    }

    @Test
    @DisplayName("confirmPlan throws EntityNotFoundException when plan is missing")
    void testConfirmPlan_PlanNotFound_ThrowsException() {
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.confirmPlan(planDate, userId));
    }

    @Test
    @DisplayName("confirmPlan throws UserNotFoundException when user is missing")
    void testConfirmPlan_UserNotFound_ThrowsException() {
        DailyPlan plan = new DailyPlan();
        plan.setId(UUID.randomUUID());
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(userRepo.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> dailyPlanService.confirmPlan(planDate, userId));
    }

    @Test
    @DisplayName("unconfirmPlan sets isConfirmed to false")
    void testUnconfirmPlan_Success() {
        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);
        plan.setIsConfirmed(true);
        plan.setConfirmedAt(OffsetDateTime.now());

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).isConfirmed(false).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);

        DailyPlanDto result = dailyPlanService.unconfirmPlan(planDate, userId);

        assertFalse(plan.getIsConfirmed());
        assertNull(plan.getConfirmedAt());
        verify(dailyPlanRepository).save(plan);
        assertNotNull(result);
    }

    @Test
    @DisplayName("unconfirmPlan throws EntityNotFoundException when plan missing")
    void testUnconfirmPlan_PlanNotFound_ThrowsException() {
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.unconfirmPlan(planDate, userId));
    }

    // --- cancelPlan ---

    @Test
    @DisplayName("cancelPlan resets un-done tasks to Backlog and deletes plan, tasks, and blocks")
    void testCancelPlan_Success() {
        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setPlanDate(planDate);

        Task task1 = new Task();
        task1.setStatus("Picked for Today");
        Task task2 = new Task();
        task2.setStatus("Done");

        DailyPlanTask pt1 = new DailyPlanTask();
        pt1.setTask(task1);
        DailyPlanTask pt2 = new DailyPlanTask();
        pt2.setTask(task2);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(planId)).thenReturn(List.of(pt1, pt2));

        dailyPlanService.cancelPlan(planDate, userId);

        assertEquals("Backlog", task1.getStatus());
        assertEquals("Done", task2.getStatus());
        verify(taskRepository).save(task1);
        verify(taskRepository, never()).save(task2);

        verify(timeBlockRepository).deleteByUserIdAndDate(eq(userId), any(), any());
        verify(dailyPlanTaskRepository).deleteByDailyPlanId(planId);
        verify(dailyPlanRepository).delete(plan);
    }

    @Test
    @DisplayName("cancelPlan does nothing when plan not found")
    void testCancelPlan_PlanNotFound_DoesNothing() {
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        dailyPlanService.cancelPlan(planDate, userId);

        verify(dailyPlanRepository, never()).delete(any());
    }

    // --- toggleTaskDone ---

    @Test
    @DisplayName("toggleTaskDone toggles pending task to Done and updates goal progress")
    void testToggleTaskDone_ToDone() {
        UUID planTaskId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();

        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setStatus("Picked for Today");
        task.setGoalId(goalId);

        DailyPlanTask planTask = new DailyPlanTask();
        planTask.setId(planTaskId);
        planTask.setDailyPlanId(planId);
        planTask.setTask(task);

        when(dailyPlanTaskRepository.findById(planTaskId)).thenReturn(Optional.of(planTask));
        when(dailyPlanRepository.findById(planId)).thenReturn(Optional.of(plan));
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        dailyPlanService.toggleTaskDone(planTaskId, userId);

        assertEquals("Done", task.getStatus());
        assertNotNull(task.getDoneAt());
        verify(taskRepository).save(task);
        verify(goalService).updateGoalProgress(goalId);
    }

    @Test
    @DisplayName("toggleTaskDone toggles Done task back to Picked for Today")
    void testToggleTaskDone_FromDone() {
        UUID planTaskId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();

        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setStatus("Done");
        task.setDoneAt(OffsetDateTime.now());
        task.setGoalId(goalId);

        DailyPlanTask planTask = new DailyPlanTask();
        planTask.setId(planTaskId);
        planTask.setDailyPlanId(planId);
        planTask.setTask(task);

        when(dailyPlanTaskRepository.findById(planTaskId)).thenReturn(Optional.of(planTask));
        when(dailyPlanRepository.findById(planId)).thenReturn(Optional.of(plan));

        dailyPlanService.toggleTaskDone(planTaskId, userId);

        assertEquals("Picked for Today", task.getStatus());
        assertNull(task.getDoneAt());
        verify(taskRepository).save(task);
        verify(goalService).updateGoalProgress(goalId);
    }

    @Test
    @DisplayName("toggleTaskDone throws EntityNotFoundException when plan task not found")
    void testToggleTaskDone_PlanTaskNotFound_ThrowsException() {
        UUID planTaskId = UUID.randomUUID();
        when(dailyPlanTaskRepository.findById(planTaskId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.toggleTaskDone(planTaskId, userId));
    }

    @Test
    @DisplayName("toggleTaskDone throws EntityNotFoundException when plan user mismatches")
    void testToggleTaskDone_UserMismatch_ThrowsException() {
        UUID planTaskId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();

        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(UUID.randomUUID()); // Different user

        DailyPlanTask planTask = new DailyPlanTask();
        planTask.setId(planTaskId);
        planTask.setDailyPlanId(planId);

        when(dailyPlanTaskRepository.findById(planTaskId)).thenReturn(Optional.of(planTask));
        when(dailyPlanRepository.findById(planId)).thenReturn(Optional.of(plan));

        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.toggleTaskDone(planTaskId, userId));
    }

    // --- reviewPlan ---

    @Test
    @DisplayName("reviewPlan processes DELETE, BACKLOG, TODAY actions and updates isReviewed")
    void testReviewPlan_ProcessesActions() {
        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);
        plan.setIsReviewed(false);

        UUID taskDeleteId = UUID.randomUUID();
        UUID taskBacklogId = UUID.randomUUID();
        UUID taskTodayId = UUID.randomUUID();

        Task taskDelete = new Task();
        taskDelete.setId(taskDeleteId);
        taskDelete.setUserId(userId);
        taskDelete.setGoalId(UUID.randomUUID());

        Task taskBacklog = new Task();
        taskBacklog.setId(taskBacklogId);
        taskBacklog.setUserId(userId);

        Task taskToday = new Task();
        taskToday.setId(taskTodayId);
        taskToday.setUserId(userId);
        taskToday.setIsImportant(true);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        when(taskRepository.findById(taskDeleteId)).thenReturn(Optional.of(taskDelete));
        when(taskRepository.findById(taskBacklogId)).thenReturn(Optional.of(taskBacklog));
        when(taskRepository.findById(taskTodayId)).thenReturn(Optional.of(taskToday));

        LocalDate todayDate = planDate.plusDays(1);
        DailyPlan todayPlan = new DailyPlan();
        todayPlan.setId(UUID.randomUUID());
        todayPlan.setUserId(userId);
        todayPlan.setPlanDate(todayDate);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, todayDate)).thenReturn(Optional.of(todayPlan));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(todayPlan.getId())).thenReturn(List.of());
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())).thenReturn(List.of());

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).isReviewed(true).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);

        ReviewPlanRequest request = new ReviewPlanRequest(
                todayDate,
                List.of(
                        new ReviewPlanRequest.TaskReviewItem(taskDeleteId, "DELETE"),
                        new ReviewPlanRequest.TaskReviewItem(taskBacklogId, "BACKLOG"),
                        new ReviewPlanRequest.TaskReviewItem(taskTodayId, "TODAY")
                )
        );

        DailyPlanDto result = dailyPlanService.reviewPlan(planDate, request, userId);

        assertTrue(plan.getIsReviewed());
        verify(dailyPlanRepository).save(plan);

        // Verify DELETE action
        verify(dailyPlanTaskRepository).deleteByTaskId(taskDeleteId);
        verify(timeBlockRepository).deleteByTaskId(taskDeleteId);
        verify(taskRepository).delete(taskDelete);
        verify(goalService).updateGoalProgress(taskDelete.getGoalId());

        // Verify BACKLOG action
        assertEquals("Backlog", taskBacklog.getStatus());
        verify(taskRepository).save(taskBacklog);

        // Verify TODAY action
        assertEquals("Picked for Today", taskToday.getStatus());
        verify(taskRepository).save(taskToday);
        verify(dailyPlanTaskRepository).save(any(DailyPlanTask.class));

        assertNotNull(result);
        verify(autoScheduleService).autoSchedule(userId, 15);
    }

    @Test
    @DisplayName("reviewPlan adjusts worked blocks and deletes unworked blocks from yesterday")
    void testReviewPlan_TimeBlockCleanupAndAdjustment() {
        UUID planId = UUID.randomUUID();
        DailyPlan plan = new DailyPlan();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));

        TaskTimeBlock workedBlock = new TaskTimeBlock();
        workedBlock.setId(UUID.randomUUID());
        workedBlock.setStartTime(planDate.atTime(10, 0));
        workedBlock.setEndTime(planDate.atTime(11, 0));
        workedBlock.setActualMinutes(30);

        TaskTimeBlock unworkedBlock = new TaskTimeBlock();
        unworkedBlock.setId(UUID.randomUUID());
        unworkedBlock.setStartTime(planDate.atTime(14, 0));
        unworkedBlock.setEndTime(planDate.atTime(15, 0));
        unworkedBlock.setActualMinutes(0);
        unworkedBlock.setIsCompleted(false);

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(workedBlock, unworkedBlock));

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).isReviewed(true).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);

        dailyPlanService.reviewPlan(planDate, new ReviewPlanRequest(planDate.plusDays(1), List.of()), userId);

        assertEquals(planDate.atTime(10, 30), workedBlock.getEndTime());
        verify(timeBlockRepository).save(workedBlock);
        verify(timeBlockRepository).delete(unworkedBlock);
    }

    @Test
    @DisplayName("reviewPlan throws EntityNotFoundException when plan not found")
    void testReviewPlan_PlanNotFound_ThrowsException() {
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> dailyPlanService.reviewPlan(planDate, null, userId));
    }

    // --- getUnreviewedPlan ---

    @Test
    @DisplayName("getUnreviewedPlan returns plan Dto when unreviewed plan exists")
    void testGetUnreviewedPlan_Found() {
        DailyPlan unreviewed = new DailyPlan();
        UUID planId = UUID.randomUUID();
        unreviewed.setId(planId);
        unreviewed.setUserId(userId);
        unreviewed.setPlanDate(planDate.minusDays(1));

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).build();

        when(dailyPlanRepository.findFirstByUserIdAndPlanDateBeforeAndIsConfirmedTrueAndIsReviewedFalseOrderByPlanDateDesc(userId, planDate))
                .thenReturn(Optional.of(unreviewed));
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, unreviewed.getPlanDate())).thenReturn(Optional.of(unreviewed));
        when(dailyPlanMapper.toDto(unreviewed)).thenReturn(baseDto);

        DailyPlanDto result = dailyPlanService.getUnreviewedPlan(planDate, userId);

        assertNotNull(result);
        assertEquals(planId, result.id());
    }

    @Test
    @DisplayName("getUnreviewedPlan returns null when no unreviewed plan exists")
    void testGetUnreviewedPlan_NotFound() {
        when(dailyPlanRepository.findFirstByUserIdAndPlanDateBeforeAndIsConfirmedTrueAndIsReviewedFalseOrderByPlanDateDesc(userId, planDate))
                .thenReturn(Optional.empty());

        DailyPlanDto result = dailyPlanService.getUnreviewedPlan(planDate, userId);

        assertNull(result);
    }

    // --- scheduleTaskTimeBlock (internal logic test via preferTime with fixed events overlap) ---

    @Test
    @DisplayName("scheduleTaskTimeBlock shifts candidate start when fixed event overlaps")
    void testScheduleTaskTimeBlock_FixedEventOverlap_ShiftsTime() {
        UUID taskId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();

        Task task = new Task();
        task.setId(taskId);
        task.setUserId(userId);
        task.setGoalId(goalId);
        task.setEstimatedMinutes(60);

        Goal goal = new Goal();
        goal.setId(goalId);
        goal.setPreferTime(LocalTime.of(9, 0)); // 9:00 - 10:00

        DailyPlan plan = new DailyPlan();
        UUID planId = UUID.randomUUID();
        plan.setId(planId);
        plan.setUserId(userId);
        plan.setPlanDate(planDate);

        FixedEventResponse fixedEvent = mock(FixedEventResponse.class);
        when(fixedEvent.startTime()).thenReturn(LocalTime.of(9, 0));
        when(fixedEvent.endTime()).thenReturn(LocalTime.of(10, 0));
        when(fixedEvent.occurrenceDate()).thenReturn(planDate);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)).thenReturn(Optional.of(plan));
        when(dailyPlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(planId)).thenReturn(List.of());
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(goalRepository.findById(goalId)).thenReturn(Optional.of(goal));
        when(timeBlockRepository.findByTaskId(taskId)).thenReturn(List.of());
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(userId, planDate, planDate)).thenReturn(List.of(fixedEvent));

        PlanMyDayRequest request = new PlanMyDayRequest(
                planDate, 120, List.of(new PlanMyDayRequest.PlanTaskItem(taskId, false, 1))
        );

        DailyPlanDto baseDto = DailyPlanDto.builder().id(planId).build();
        when(dailyPlanMapper.toDto(plan)).thenReturn(baseDto);

        dailyPlanService.planMyDay(request, userId);

        // Time block should be shifted to start at 10:00 instead of 9:00 due to fixed event overlap
        ArgumentCaptor<TaskTimeBlock> captor = ArgumentCaptor.forClass(TaskTimeBlock.class);
        verify(timeBlockRepository).save(captor.capture());

        TaskTimeBlock savedBlock = captor.getValue();
        assertEquals(LocalDateTime.of(planDate, LocalTime.of(10, 0)), savedBlock.getStartTime());
        assertEquals(LocalDateTime.of(planDate, LocalTime.of(11, 0)), savedBlock.getEndTime());
    }
}
