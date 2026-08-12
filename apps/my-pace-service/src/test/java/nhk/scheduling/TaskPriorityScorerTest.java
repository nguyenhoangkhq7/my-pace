package nhk.scheduling;

import nhk.planning.DailyPlan;
import nhk.task.Task;
import nhk.timeblock.TaskTimeBlock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TaskPriorityScorerTest {

    @Mock
    private InMemoryBitmapScheduler bitmapScheduler;

    @InjectMocks
    private TaskPriorityScorer scorer;

    private ScheduleContext ctx;
    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() {
        // Mock free time: 1440 mins per day
        when(bitmapScheduler.findFreeGaps(eq(userId), any(LocalDate.class), anyInt(), anyInt(), anyInt()))
                .thenAnswer(inv -> List.of(new InMemoryBitmapScheduler.ScheduleGap(0, 1440, 1440)));

        ctx = new ScheduleContext(
                userId,
                ZoneId.systemDefault(),
                today,
                today.plusDays(7),
                List.of(today, today.plusDays(1), today.plusDays(2), today.plusDays(3), today.plusDays(4), today.plusDays(5), today.plusDays(6), today.plusDays(7)),
                0, 360, 1320,
                new HashMap<>(),
                new HashMap<>(),
                new HashMap<>(),
                new HashMap<>(),
                Collections.emptyMap(),
                new ArrayList<>(),
                new HashMap<>()
        );
    }

    private Task createTask(String title, boolean isUrgent, boolean isImportant, LocalDateTime dueDate, int estMins) {
        Task t = new Task();
        t.setId(UUID.randomUUID());
        t.setTitle(title);
        t.setIsUrgent(isUrgent);
        t.setIsImportant(isImportant);
        t.setDueDate(dueDate);
        t.setEstimatedMinutes(estMins);
        return t;
    }

    @Test
    void testScenario1_Q1HighRisk_vs_Q2() {
        Task t1 = createTask("Q1 High Risk", true, true, today.atTime(23, 59), 800);
        Task t2 = createTask("Q2", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Q1 High Risk", res.backlogQueue().get(0).task.getTitle(), "Q1 High Risk (Rank 0) must beat Q2 (Rank 1)");
    }

    @Test
    void testScenario2_Q1LowRisk_vs_Q2() {
        Task t1 = createTask("Q1 Low Risk", true, true, today.plusDays(7).atTime(23, 59), 100);
        Task t2 = createTask("Q2", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Q2", res.backlogQueue().get(0).task.getTitle(), "Q2 (Rank 1) must beat Q1 Low Risk (Rank 2)");
    }

    @Test
    void testScenario3_Q3HighRisk_vs_Q2() {
        Task t1 = createTask("Q3 High Risk", true, false, today.atTime(23, 59), 800);
        Task t2 = createTask("Q2", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Q3 High Risk", res.backlogQueue().get(0).task.getTitle(), "Q3 High Risk (Rank 0) must beat Q2 (Rank 1)");
    }

    @Test
    void testScenario4_Q1LowRisk_vs_Q3Standard() {
        Task t1 = createTask("Q1 Low Risk", true, true, today.plusDays(7).atTime(23, 59), 100);
        Task t2 = createTask("Q3 Standard", true, false, null, 100); 

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Q1 Low Risk", res.backlogQueue().get(0).task.getTitle(), "Q1 Low Risk (Rank 2) must beat Q3 Standard (Rank 3)");
    }

    @Test
    void testScenario5_Q3LowRisk_vs_Q4() {
        Task t1 = createTask("Q3 Low Risk", true, false, today.plusDays(7).atTime(23, 59), 100);
        Task t2 = createTask("Q4", false, false, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Q3 Low Risk", res.backlogQueue().get(0).task.getTitle(), "Both Rank 4, but Q3 has due date so it wins");
    }

    @Test
    void testScenario6_SameRank_DueDateWins() {
        Task t1_high = createTask("Due Today 23:59", true, true, today.atTime(23, 59), 800);
        Task t2_high = createTask("Due Today 12:00", true, true, today.atTime(12, 0), 1000);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1_high, t2_high), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Due Today 12:00", res.backlogQueue().get(0).task.getTitle(), "Due Today 12:00 is earlier");
    }
    @Test
    void testScenario7_DueToday_AlwaysHighRisk() {
        // Due today, takes only 30 mins, but because it's due today, it's Rank 0 (High Risk)
        Task t1 = createTask("Nộp CV", true, true, today.atTime(23, 59), 30);
        // Q2 takes 100 mins -> Rank 1
        Task t2 = createTask("Học tiếng Anh", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Nộp CV", res.backlogQueue().get(0).task.getTitle(), "Nộp CV (Due Today -> High Risk Rank 0) must beat Q2");
    }
    @Test
    void testScenario8_SlackTimeLessThan480_HighRisk() {
        // Due tomorrow. Total free time = 2880 mins.
        // Task est = 2500 mins. rem = 2500. trueSlackTime = 2880 - 2500 = 380 mins.
        // trueSlackTime (380) < 480 -> High Risk (Rank 0)
        Task t1 = createTask("Huge Task", true, true, today.plusDays(1).atTime(23, 59), 2500);
        Task t2 = createTask("Q2", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Huge Task", res.backlogQueue().get(0).task.getTitle(), "trueSlackTime < 480 -> High Risk (Rank 0)");
    }

    @Test
    void testScenario9_SlackRatioLessThanHalf_HighRisk() {
        // Due tomorrow. Total free time = 2880 mins.
        // Task est = 2000 mins. rem = 2000. trueSlackTime = 2880 - 2000 = 880 mins.
        // 880 is NOT < 480. BUT 880 < (2000 * 0.5 = 1000). So it is High Risk.
        Task t1 = createTask("Relative High Risk", true, true, today.plusDays(1).atTime(23, 59), 2000);
        Task t2 = createTask("Q2", false, true, null, 100);

        ctx = new ScheduleContext(userId, ctx.zoneId(), ctx.startDate(), ctx.endDate(), ctx.dateRange(), 
                ctx.bufferMinutes(), ctx.wakeMin(), ctx.sleepMin(), ctx.categoryMap(), ctx.planMap(), 
                ctx.taskTimeBlocksByDate(), ctx.dailyPlanTasksByPlanId(), Collections.emptyMap(), List.of(t1, t2), ctx.taskTimeBlocksByTaskId());

        TaskQueueResult res = scorer.buildTaskQueues(ctx);
        assertEquals("Relative High Risk", res.backlogQueue().get(0).task.getTitle(), "trueSlackTime < rem * 0.5 -> High Risk (Rank 0)");
    }
}
