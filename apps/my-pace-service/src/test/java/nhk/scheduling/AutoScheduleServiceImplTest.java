package nhk.scheduling;

import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
import nhk.category.CategoryRepository;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockDto;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AutoScheduleServiceImplTest {

    private UserRepository userRepo;
    private TaskRepository taskRepository;
    private DailyPlanRepository dailyPlanRepository;
    private TaskTimeBlockRepository timeBlockRepository;
    private FixedEventService eventService;
    private InMemoryBitmapScheduler bitmapScheduler;
    private GoalRepository goalRepository;
    private CategoryRepository categoryRepository;
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    private AutoScheduleServiceImpl service;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        taskRepository = mock(TaskRepository.class);
        dailyPlanRepository = mock(DailyPlanRepository.class);
        timeBlockRepository = mock(TaskTimeBlockRepository.class);
        eventService = mock(FixedEventService.class);
        bitmapScheduler = mock(InMemoryBitmapScheduler.class);
        goalRepository = mock(GoalRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        dailyPlanTaskRepository = mock(DailyPlanTaskRepository.class);

        service = new AutoScheduleServiceImpl(
                userRepo, taskRepository, dailyPlanRepository,
                timeBlockRepository, eventService, bitmapScheduler,
                goalRepository, categoryRepository, dailyPlanTaskRepository
        );
    }

    @Test
    void testAutoScheduleWeek_UnplannedDatesScheduleBacklog() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        Task q1NotUrgent = new Task();
        q1NotUrgent.setId(UUID.randomUUID());
        q1NotUrgent.setTitle("Q1 Task Not Urgent");
        q1NotUrgent.setEstimatedMinutes(60);
        q1NotUrgent.setActualMinutes(0);
        q1NotUrgent.setIsUrgent(true);
        q1NotUrgent.setIsImportant(true);
        q1NotUrgent.setStatus("Backlog");

        Task q2Task = new Task();
        q2Task.setId(UUID.randomUUID());
        q2Task.setTitle("Q2 Deep Work Task");
        q2Task.setEstimatedMinutes(60);
        q2Task.setActualMinutes(0);
        q2Task.setIsUrgent(false);
        q2Task.setIsImportant(true);
        q2Task.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(q1NotUrgent, q2Task));
        when(dailyPlanRepository.findByUserIdAndPlanDate(any(), any())).thenReturn(Optional.empty());
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(any(), any(), any())).thenReturn(List.of());
        when(dailyPlanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeBlockRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(bitmapScheduler.findFreeGaps(any(), any(), anyInt(), anyInt(), anyInt()))
                .thenReturn(List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 1000, 520)));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, LocalDate.now(), 10, false);

        assertNotNull(response);
        assertNotNull(response.schedule());
        assertFalse(response.schedule().isEmpty());

        // Verify DailyPlanTask records are NOT created for backlog preview blocks on unplanned dates
        verify(dailyPlanTaskRepository, never()).saveAll(anyCollection());
    }

    @Test
    void testPlanDateOnlySchedulesPickedTasks() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        Task q1BacklogTask = new Task();
        q1BacklogTask.setId(UUID.randomUUID());
        q1BacklogTask.setTitle("Q1 Backlog Task");
        q1BacklogTask.setEstimatedMinutes(60);
        q1BacklogTask.setActualMinutes(0);
        q1BacklogTask.setIsUrgent(true);
        q1BacklogTask.setIsImportant(true);
        q1BacklogTask.setStatus("Backlog");

        Task q2PickedTask = new Task();
        q2PickedTask.setId(UUID.randomUUID());
        q2PickedTask.setTitle("Q2 Picked Task");
        q2PickedTask.setEstimatedMinutes(60);
        q2PickedTask.setActualMinutes(0);
        q2PickedTask.setIsUrgent(false);
        q2PickedTask.setIsImportant(true);
        q2PickedTask.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(q1BacklogTask, q2PickedTask));

        LocalDate today = LocalDate.now();
        DailyPlan todayPlan = new DailyPlan();
        todayPlan.setId(UUID.randomUUID());
        todayPlan.setUserId(userId);
        todayPlan.setPlanDate(today);

        // Mock today has a DailyPlan, but future dates do not
        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, today)).thenReturn(Optional.of(todayPlan));
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(any(), any(), any())).thenReturn(List.of(todayPlan));
        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of());

        DailyPlanTask pickedDpt = new DailyPlanTask();
        pickedDpt.setDailyPlanId(todayPlan.getId());
        pickedDpt.setTask(q2PickedTask);

        when(dailyPlanTaskRepository.findByDailyPlanIdIn(anyList()))
                .thenReturn(List.of(pickedDpt));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(todayPlan.getId()))
                .thenReturn(List.of(pickedDpt));

        when(timeBlockRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        when(bitmapScheduler.findFreeGaps(any(), any(), anyInt(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    int wStart = inv.getArgument(2);
                    return List.of(new InMemoryBitmapScheduler.ScheduleGap(wStart, wStart + 60, 60));
                });

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        var blocks = response.schedule().get(today);
        assertNotNull(blocks);
        assertFalse(blocks.isEmpty());

        // Verify ONLY the picked Q2 task is scheduled on today's plan date, NOT the Q1 backlog task
        assertEquals(1, blocks.size());
        assertEquals(q2PickedTask.getId(), blocks.get(0).taskId());
    }

    @Test
    void testStateReconciliation_PreservesExistingBlockId() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Reconciliation Task");
        task.setEstimatedMinutes(60);
        task.setActualMinutes(0);
        task.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));

        LocalDate today = LocalDate.now();
        DailyPlan todayPlan = new DailyPlan();
        todayPlan.setId(UUID.randomUUID());
        todayPlan.setUserId(userId);
        todayPlan.setPlanDate(today);

        when(dailyPlanRepository.findByUserIdAndPlanDate(any(), any())).thenReturn(Optional.of(todayPlan));
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(any(), any(), any())).thenReturn(List.of(todayPlan));

        UUID existingBlockId = UUID.randomUUID();
        TaskTimeBlock existingFreeBlock = new TaskTimeBlock();
        existingFreeBlock.setId(existingBlockId);
        existingFreeBlock.setTaskId(task.getId());
        existingFreeBlock.setTaskId(task.getId());
        existingFreeBlock.setPartIndex(1);
        existingFreeBlock.setTotalParts(1);
        existingFreeBlock.setAvailabilityStatus("FREE");
        existingFreeBlock.setStartTime(today.atTime(8, 0));
        existingFreeBlock.setEndTime(today.atTime(9, 0));

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                .thenReturn(List.of(existingFreeBlock));
        when(bitmapScheduler.findFreeGaps(any(), any(), anyInt(), anyInt(), anyInt()))
                .thenReturn(List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60)));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        var blocks = response.schedule().get(today);
        assertNotNull(blocks);
        assertFalse(blocks.isEmpty());
        // Verify existing timeblock ID was preserved by State Reconciliation (no delete and recreate)
        assertEquals(existingBlockId, blocks.get(0).id());
        // verified below
        verify(timeBlockRepository, never()).deleteAll(anyCollection());
    }

    @Test
    void testScenario3_AntiBreadcrumbShrinking() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        Task task250 = new Task();
        task250.setId(UUID.randomUUID());
        task250.setTitle("250m AntiBreadcrumb Task");
        task250.setEstimatedMinutes(250);
        task250.setActualMinutes(0);
        task250.setIsSplittable(true);
        task250.setMinChunkMinutes(30);
        task250.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task250));

        LocalDate today = LocalDate.now();
        DailyPlan plan = new DailyPlan();
        plan.setId(UUID.randomUUID());
        plan.setUserId(userId);
        plan.setPlanDate(today);

        when(dailyPlanRepository.findByUserIdAndPlanDate(any(), any())).thenReturn(Optional.empty());
        when(dailyPlanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeBlockRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Wide open gap of 600 minutes (7:00 to 17:00)
        when(bitmapScheduler.findFreeGaps(any(), any(), anyInt(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    int wStart = inv.getArgument(2);
                    return List.of(new InMemoryBitmapScheduler.ScheduleGap(wStart, wStart + 600, 600));
                });

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        var blocks = response.schedule().get(today);
        assertNotNull(blocks);

        // Verify total scheduled minutes sum up to 250 and no block is < 30m
        int totalScheduled = blocks.stream().mapToInt(b -> (int) java.time.Duration.between(b.startTime(), b.endTime()).toMinutes()).sum();
        assertEquals(250, totalScheduled);
        assertTrue(blocks.stream().allMatch(b -> java.time.Duration.between(b.startTime(), b.endTime()).toMinutes() >= 30));
        
        // Verify Balanced Splitting & Anti-Breadcrumb: 3 balanced chunks summing to 250m with no fragment < 30m
        assertEquals(3, blocks.size());
        int b0 = (int) java.time.Duration.between(blocks.get(0).startTime(), blocks.get(0).endTime()).toMinutes();
        int b1 = (int) java.time.Duration.between(blocks.get(1).startTime(), blocks.get(1).endTime()).toMinutes();
        int b2 = (int) java.time.Duration.between(blocks.get(2).startTime(), blocks.get(2).endTime()).toMinutes();
        assertEquals(250, b0 + b1 + b2);
        assertTrue(b0 >= 30 && b1 >= 30 && b2 >= 30);
    }

    @Test
    void testDataLossBug_EmptyDateQueuePreservesExistingBlocks() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("UTC");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        // No tasks in queue for this user
        when(taskRepository.findByUserId(userId)).thenReturn(List.of());

        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        DailyPlan plan = new DailyPlan();
        plan.setId(UUID.randomUUID());
        plan.setUserId(userId);
        plan.setPlanDate(today);
        plan.setIsConfirmed(false); // Unconfirmed plan, subject to reconciliation

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, today)).thenReturn(Optional.of(plan));
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(any(), any(), any())).thenReturn(List.of(plan));

        // Existing block that should be preserved because activeQueue is empty -> date skipped
        TaskTimeBlock existingBlock = new TaskTimeBlock();
        existingBlock.setId(UUID.randomUUID());
        existingBlock.setTaskId(UUID.randomUUID());
        existingBlock.setTaskId(UUID.randomUUID());
        existingBlock.setAvailabilityStatus("FREE");
        existingBlock.setStartTime(today.atTime(10, 0));
        existingBlock.setEndTime(today.atTime(11, 0));

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                .thenReturn(List.of(existingBlock));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        var blocks = response.schedule().get(today);
        assertNotNull(blocks);
        assertFalse(blocks.isEmpty());
        assertEquals(existingBlock.getId(), blocks.get(0).id());
        
        // Verify timeBlockRepository.deleteAll was NEVER called
        verify(timeBlockRepository, never()).deleteAll(anyCollection());
    }

    @Test
    void testDataLossBug_WindowEndPassedPreservesExistingBlocks() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("UTC");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0)); // Sleep at 23:00

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Task 1");
        task.setEstimatedMinutes(60);
        task.setActualMinutes(0);
        task.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));

        user.setSleepTime(LocalTime.of(0, 0)); // Sleep at midnight (00:00). Current time will definitely be >= 00:00

        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        DailyPlan plan = new DailyPlan();
        plan.setId(UUID.randomUUID());
        plan.setUserId(userId);
        plan.setPlanDate(today);
        plan.setIsConfirmed(false);

        when(dailyPlanRepository.findByUserIdAndPlanDate(userId, today)).thenReturn(Optional.of(plan));
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(any(), any(), any())).thenReturn(List.of(plan));

        TaskTimeBlock existingBlock = new TaskTimeBlock();
        existingBlock.setId(UUID.randomUUID());
        existingBlock.setTaskId(task.getId());
        existingBlock.setTaskId(task.getId());
        existingBlock.setAvailabilityStatus("FREE");
        existingBlock.setStartTime(today.atTime(10, 0));
        existingBlock.setEndTime(today.atTime(11, 0));

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                .thenReturn(List.of(existingBlock));
                
        // ensure task is picked for today
        DailyPlanTask dpt = new DailyPlanTask();
        dpt.setDailyPlanId(plan.getId());
        dpt.setTask(task);
        when(dailyPlanTaskRepository.findByDailyPlanIdIn(anyList()))
                .thenReturn(List.of(dpt));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId()))
                .thenReturn(List.of(dpt));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        var blocks = response.schedule().get(today);
        assertNotNull(blocks);
        assertFalse(blocks.isEmpty());
        assertEquals(existingBlock.getId(), blocks.get(0).id());

        // Verify timeBlockRepository.deleteAll was NEVER called
        verify(timeBlockRepository, never()).deleteAll(anyCollection());
    }

    @Test
    void testSubtractBusyRange_TrimStart() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60));
        // busy block from 470 to 500. Should trim start to 500-540.
        List<InMemoryBitmapScheduler.ScheduleGap> result = service.subtractBusyRange(gaps, 470, 500);
        assertEquals(1, result.size());
        assertEquals(500, result.get(0).startMin());
        assertEquals(540, result.get(0).endMin());
        assertEquals(40, result.get(0).durationMin());
    }

    @Test
    void testSubtractBusyRange_TrimEnd() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60));
        // busy block from 520 to 550. Should trim end to 480-520.
        List<InMemoryBitmapScheduler.ScheduleGap> result = service.subtractBusyRange(gaps, 520, 550);
        assertEquals(1, result.size());
        assertEquals(480, result.get(0).startMin());
        assertEquals(520, result.get(0).endMin());
        assertEquals(40, result.get(0).durationMin());
    }

    @Test
    void testSubtractBusyRange_SplitMiddle() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60));
        // busy block from 500 to 520. Should split to 480-500 and 520-540.
        List<InMemoryBitmapScheduler.ScheduleGap> result = service.subtractBusyRange(gaps, 500, 520);
        assertEquals(2, result.size());
        assertEquals(480, result.get(0).startMin());
        assertEquals(500, result.get(0).endMin());
        assertEquals(20, result.get(0).durationMin());
        assertEquals(520, result.get(1).startMin());
        assertEquals(540, result.get(1).endMin());
        assertEquals(20, result.get(1).durationMin());
    }

    @Test
    void testSubtractBusyRange_CompleteRemove() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60));
        // busy block from 470 to 550. Should remove gap completely.
        List<InMemoryBitmapScheduler.ScheduleGap> result = service.subtractBusyRange(gaps, 470, 550);
        assertTrue(result.isEmpty());
    }

    @Test
    void testSubtractBusyRange_BufferExceedsEnd() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 540, 60));
        // busy block from 510 to 530, but buffer is 20 -> end is 550. Should trim end to 480-510.
        List<InMemoryBitmapScheduler.ScheduleGap> result = service.subtractBusyRange(gaps, 510, 550);
        assertEquals(1, result.size());
        assertEquals(480, result.get(0).startMin());
        assertEquals(510, result.get(0).endMin());
        assertEquals(30, result.get(0).durationMin());
    }

    @Test
    void testFixedEvents_MarkedBusyInBitmap() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());
        when(taskRepository.findByUserId(userId)).thenReturn(List.of());

        LocalDate today = LocalDate.now();
        FixedEventResponse event = FixedEventResponse.builder()
                .id("ev-1")
                .occurrenceDate(today)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .isAllDay(false)
                .build();

        when(eventService.getEventsInRange(eq(userId), any(), any())).thenReturn(List.of(event));

        service.autoScheduleWeek(userId, today, 10, true);

        // Verify fixed event is marked busy in bitmap with buffer (10:00 -> 11:10 = 600..670 min)
        verify(bitmapScheduler).markRangeBusy(eq(userId), eq(today), eq(600), eq(670));
    }

    @Test
    void testDueDateConstraint_TaskNotScheduledPastDueDate() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(eventService.getEventsInRange(any(), any(), any())).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of());

        LocalDate today = LocalDate.now();
        LocalDate pastDue = today.minusDays(1); // Due yesterday

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Overdue Task");
        task.setEstimatedMinutes(60);
        task.setStatus("Backlog");
        task.setDueDate(pastDue.atTime(18, 0));

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));
        when(bitmapScheduler.findFreeGaps(any(), any(), anyInt(), anyInt(), anyInt()))
                .thenReturn(List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 1000, 520)));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, false);

        assertNotNull(response);
        // Verify task was NOT scheduled on today (which is past due date)
        List<TaskTimeBlockDto> todayBlocks = response.schedule().get(today);
        assertTrue(todayBlocks == null || todayBlocks.isEmpty());
    }

    @Test
    void testConcurrentExecution_ThrowsExceptionWhenAlreadyRunning() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");

        java.util.concurrent.CountDownLatch lockAcquiredLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch releaseLockLatch = new java.util.concurrent.CountDownLatch(1);

        when(userRepo.findById(userId)).thenAnswer(inv -> {
            lockAcquiredLatch.countDown();
            try {
                releaseLockLatch.await(5, java.util.concurrent.TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return Optional.of(user);
        });

        new Thread(() -> service.autoScheduleWeek(userId, LocalDate.now(), 10, true)).start();

        assertTrue(lockAcquiredLatch.await(2, java.util.concurrent.TimeUnit.SECONDS));

        assertThrows(IllegalStateException.class, () -> service.autoScheduleWeek(userId, LocalDate.now(), 10, true));

        releaseLockLatch.countDown();
    }

    @Test
    void testAutoScheduleWeek_ConfirmedPlanIsSkippedDuringScheduling() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        LocalDate today = LocalDate.now();
        DailyPlan confirmedPlan = new DailyPlan();
        confirmedPlan.setId(UUID.randomUUID());
        confirmedPlan.setUserId(userId);
        confirmedPlan.setPlanDate(today);
        confirmedPlan.setIsConfirmed(true);

        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(eq(userId), any(), any()))
                .thenReturn(List.of(confirmedPlan));

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Task in confirmed plan");
        task.setEstimatedMinutes(120);
        task.setActualMinutes(0);
        task.setStatus("Backlog");

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));

        DailyPlanTask dpt = new DailyPlanTask();
        dpt.setDailyPlanId(confirmedPlan.getId());
        dpt.setTask(task);
        when(dailyPlanTaskRepository.findByDailyPlanIdIn(anyList())).thenReturn(List.of(dpt));
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(confirmedPlan.getId())).thenReturn(List.of(dpt));

        TaskTimeBlock existingBlock = new TaskTimeBlock();
        existingBlock.setId(UUID.randomUUID());
        existingBlock.setTaskId(task.getId());
        existingBlock.setTaskId(task.getId());
        existingBlock.setStartTime(today.atTime(8, 0));
        existingBlock.setEndTime(today.atTime(9, 0));
        existingBlock.setAvailabilityStatus("FREE");

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of(existingBlock));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, today, 10, true);

        assertNotNull(response);
        // Ensure no new blocks were saved or generated since plan is confirmed
        verify(timeBlockRepository, never()).saveAll(anyCollection());
        verify(timeBlockRepository, never()).deleteAll(anyCollection());
        // Existing block should be returned unmodified
        assertEquals(1, response.schedule().get(today).size());
        assertEquals(existingBlock.getId(), response.schedule().get(today).get(0).id());
    }

    @Test
    void testAutoScheduleWeek_BacklogPreviewDoesNotLockPlanOnSecondRun() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setTimezone("Asia/Ho_Chi_Minh");
        user.setWakeTime(LocalTime.of(7, 0));
        user.setSleepTime(LocalTime.of(23, 0));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        DailyPlan previewPlan = new DailyPlan();
        previewPlan.setId(UUID.randomUUID());
        previewPlan.setUserId(userId);
        previewPlan.setPlanDate(tomorrow);
        previewPlan.setIsConfirmed(false);

        // Simulate 2nd run: DailyPlan exists from 1st run, but NO DailyPlanTasks exist for it
        when(dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(eq(userId), any(), any()))
                .thenReturn(List.of(previewPlan));
        when(dailyPlanTaskRepository.findByDailyPlanIdIn(anyList())).thenReturn(List.of());
        when(dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(previewPlan.getId())).thenReturn(List.of());

        Task backlogTask = new Task();
        backlogTask.setId(UUID.randomUUID());
        backlogTask.setTitle("Backlog Task");
        backlogTask.setEstimatedMinutes(60);
        backlogTask.setActualMinutes(0);
        backlogTask.setStatus("Backlog");

        TaskTimeBlock oldPreviewBlock = new TaskTimeBlock();
        oldPreviewBlock.setId(UUID.randomUUID());
        oldPreviewBlock.setTaskId(backlogTask.getId());
        oldPreviewBlock.setTaskId(backlogTask.getId());
        oldPreviewBlock.setStartTime(tomorrow.atTime(8, 0));
        oldPreviewBlock.setEndTime(tomorrow.atTime(9, 0));
        oldPreviewBlock.setAvailabilityStatus("FREE");

        when(timeBlockRepository.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(List.of(oldPreviewBlock));
        when(taskRepository.findByUserId(userId)).thenReturn(List.of(backlogTask));
        when(bitmapScheduler.findFreeGaps(any(), eq(tomorrow), anyInt(), anyInt(), anyInt()))
                .thenReturn(List.of(new InMemoryBitmapScheduler.ScheduleGap(480, 1000, 520)));
        when(timeBlockRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AutoScheduleResponse response = service.autoScheduleWeek(userId, tomorrow, 10, true);

        assertNotNull(response);
        assertFalse(response.schedule().get(tomorrow).isEmpty());
        // Verify DailyPlanTask records are still NEVER created on 2nd run for unconfirmed empty plan
        verify(dailyPlanTaskRepository, never()).saveAll(anyCollection());
        // Verify backlog task was scheduled as preview block
        assertEquals(backlogTask.getId(), response.schedule().get(tomorrow).get(0).taskId());
    }
}
