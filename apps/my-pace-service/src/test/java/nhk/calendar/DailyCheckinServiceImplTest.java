package nhk.calendar;

import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyCheckinServiceImplTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private DailyCheckinRepository checkinRepo;

    @Mock
    private GoalRepository goalRepo;

    @Mock
    private TaskRepository taskRepo;

    @Mock
    private DailyPlanRepository dailyPlanRepo;

    @Mock
    private DailyPlanTaskRepository dailyPlanTaskRepo;

    @Mock
    private TaskTimeBlockRepository taskTimeBlockRepo;

    @Mock
    private FixedEventService eventService;

    @Mock
    private AvailableTimeService availableTimeService;

    @Mock
    private nhk.scheduling.AutoScheduleService autoScheduleService;

    @InjectMocks
    private DailyCheckinServiceImpl service;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("UTC");
    }

    @Nested
    @DisplayName("checkin Core Tests")
    class CheckinCoreTests {

        @Test
        @DisplayName("Should throw UserNotFoundException when user does not exist")
        void checkin_UserNotFound() {
            LocalDate date = LocalDate.of(2026, 8, 5);
            when(userRepo.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.checkin(userId, date, LocalTime.of(8, 0)))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should perform initial check-in, set time, generate tasks, and return available time")
        void checkin_InitialCheckin_Success() {
            LocalDate date = LocalDate.of(2026, 8, 3); // Monday (1)
            LocalTime checkinTime = LocalTime.of(8, 30);

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, date)).thenReturn(Optional.empty());
            when(goalRepo.findByUserIdAndStatus(userId, "In Progress")).thenReturn(Collections.emptyList());

            AvailableTimeResponse expectedResp = AvailableTimeResponse.builder()
                    .availableMinutes(400)
                    .checkedIn(true)
                    .checkinTime("08:30")
                    .decayedTaskTitles(Collections.emptyList())
                    .build();
            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(expectedResp);

            AvailableTimeResponse actualResp = service.checkin(userId, date, checkinTime);

            ArgumentCaptor<DailyCheckin> captor = ArgumentCaptor.forClass(DailyCheckin.class);
            verify(checkinRepo).save(captor.capture());
            DailyCheckin savedCheckin = captor.getValue();

            assertThat(savedCheckin.getCheckinTime()).isEqualTo(checkinTime);
            assertThat(savedCheckin.getCheckinDate()).isEqualTo(date);
            assertThat(actualResp).isEqualTo(expectedResp);
        }

        @Test
        @DisplayName("Should freeze checkinTime when user has already checked in on date")
        void checkin_AlreadyCheckedIn_FreezesTime() {
            LocalDate date = LocalDate.of(2026, 8, 3);
            LocalTime originalTime = LocalTime.of(8, 0);

            DailyCheckin existingCheckin = DailyCheckin.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .checkinDate(date)
                    .checkinTime(originalTime)
                    .build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, date)).thenReturn(Optional.of(existingCheckin));

            AvailableTimeResponse expectedResp = AvailableTimeResponse.builder().build();
            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(expectedResp);

            service.checkin(userId, date, LocalTime.of(9, 30));

            // Verify checkinRepo.save was NOT called again because checkinTime is already present
            verify(checkinRepo, never()).save(any());
            verify(goalRepo, never()).findByUserIdAndStatus(any(), any());
            assertThat(existingCheckin.getCheckinTime()).isEqualTo(originalTime);
        }

        @Test
        @DisplayName("Should cleanup past unconfirmed plans by moving tasks to backlog and deleting blocks/plan tasks/plan")
        void checkin_CleanupPastUnconfirmedPlans() {
            LocalDate date = LocalDate.of(2026, 8, 3);
            LocalTime checkinTime = LocalTime.of(8, 30);

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, date)).thenReturn(Optional.empty());
            when(goalRepo.findByUserIdAndStatus(userId, "In Progress")).thenReturn(Collections.emptyList());

            AvailableTimeResponse expectedResp = AvailableTimeResponse.builder().build();
            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(expectedResp);

            // Mock past unconfirmed plan
            DailyPlan pastPlan = new DailyPlan();
            pastPlan.setId(UUID.randomUUID());
            pastPlan.setUserId(userId);
            pastPlan.setPlanDate(LocalDate.of(2026, 8, 1));
            pastPlan.setIsConfirmed(false);

            when(dailyPlanRepo.findByUserIdAndPlanDateBeforeAndIsConfirmedFalse(userId, date))
                    .thenReturn(List.of(pastPlan));

            // Mock tasks in past plan
            Task task1 = new Task();
            task1.setId(UUID.randomUUID());
            task1.setStatus("Picked for Today");

            Task task2 = new Task();
            task2.setId(UUID.randomUUID());
            task2.setStatus("Done"); // Should not be moved to backlog

            DailyPlanTask planTask1 = new DailyPlanTask();
            planTask1.setDailyPlanId(pastPlan.getId());
            planTask1.setTask(task1);

            DailyPlanTask planTask2 = new DailyPlanTask();
            planTask2.setDailyPlanId(pastPlan.getId());
            planTask2.setTask(task2);

            when(dailyPlanTaskRepo.findByDailyPlanIdOrderBySortOrderAsc(pastPlan.getId()))
                    .thenReturn(List.of(planTask1, planTask2));

            service.checkin(userId, date, checkinTime);

            // Verify task1 status changed to Backlog and saved
            assertThat(task1.getStatus()).isEqualTo("Backlog");
            verify(taskRepo).save(task1);

            // Verify task2 status unchanged and NOT saved
            assertThat(task2.getStatus()).isEqualTo("Done");
            verify(taskRepo, never()).save(task2);

            // Verify deletions
            LocalDateTime startOfDay = pastPlan.getPlanDate().atStartOfDay();
            LocalDateTime endOfDay = pastPlan.getPlanDate().plusDays(1).atStartOfDay();
            verify(taskTimeBlockRepo).deleteByUserIdAndDate(userId, startOfDay, endOfDay);
            verify(dailyPlanTaskRepo).deleteByDailyPlanId(pastPlan.getId());
            verify(dailyPlanRepo).delete(pastPlan);
        }
    }

    @Nested
    @DisplayName("Auto-Generate Daily Tasks for Goals Tests")
    class AutoGenerateGoalTasksTests {

        @Test
        @DisplayName("Should generate daily task, plan task, and auto-schedule time block for matching goal")
        void generateDailyTasks_MatchingTimeBoxedGoal() {
            LocalDate date = LocalDate.of(2026, 8, 3); // Monday (1)
            LocalTime checkinTime = LocalTime.of(8, 0);

            Goal goal = new Goal();
            goal.setId(UUID.randomUUID());
            goal.setUserId(userId);
            goal.setTitle("Read Book");
            goal.setStatus("In Progress");
            goal.setAutoCreateTask(true);
            goal.setGoalType("Time-boxed");
            goal.setDaysOfWeek("1,2,3,4,5"); // Mon - Fri
            goal.setDurationMinutes(60);
            goal.setPreferTime(LocalTime.of(9, 0));

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, date)).thenReturn(Optional.empty());
            when(goalRepo.findByUserIdAndStatus(userId, "In Progress")).thenReturn(List.of(goal));
            when(taskRepo.existsByGoalIdAndDueDate(eq(goal.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(false);
            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(AvailableTimeResponse.builder().build());

            when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> {
                Task t = invocation.getArgument(0);
                t.setId(UUID.randomUUID());
                return t;
            });

            DailyPlan plan = new DailyPlan();
            plan.setId(UUID.randomUUID());
            plan.setUserId(userId);
            plan.setPlanDate(date);
            when(dailyPlanRepo.findByUserIdAndPlanDate(userId, date)).thenReturn(Optional.of(plan));

            when(dailyPlanTaskRepo.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())).thenReturn(Collections.emptyList());
            when(eventService.getEventsInRange(userId, date, date)).thenReturn(Collections.emptyList());
            when(taskTimeBlockRepo.findByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(Collections.emptyList());

            service.checkin(userId, date, checkinTime);

            // Verify task saved
            ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
            verify(taskRepo).save(taskCaptor.capture());
            Task savedTask = taskCaptor.getValue();
            assertThat(savedTask.getTitle()).isEqualTo("Read Book");
            assertThat(savedTask.getEstimatedMinutes()).isEqualTo(60);
            assertThat(savedTask.getTaskType()).isEqualTo("GOAL_SESSION");

            // Verify plan task saved
            ArgumentCaptor<DailyPlanTask> planTaskCaptor = ArgumentCaptor.forClass(DailyPlanTask.class);
            verify(dailyPlanTaskRepo).save(planTaskCaptor.capture());
            DailyPlanTask savedPlanTask = planTaskCaptor.getValue();
            assertThat(savedPlanTask.getDailyPlanId()).isEqualTo(plan.getId());

            // Verify task time block scheduled at preferTime (09:00 to 10:00)
            ArgumentCaptor<TaskTimeBlock> timeBlockCaptor = ArgumentCaptor.forClass(TaskTimeBlock.class);
            verify(taskTimeBlockRepo).save(timeBlockCaptor.capture());
            TaskTimeBlock savedBlock = timeBlockCaptor.getValue();
            assertThat(savedBlock.getStartTime()).isEqualTo(LocalDateTime.of(date, LocalTime.of(9, 0)));
            assertThat(savedBlock.getEndTime()).isEqualTo(LocalDateTime.of(date, LocalTime.of(10, 0)));
        }

        @Test
        @DisplayName("Should skip task generation if task already exists for goal on date")
        void generateDailyTasks_TaskAlreadyExists_Skipped() {
            LocalDate date = LocalDate.of(2026, 8, 3);
            LocalTime checkinTime = LocalTime.of(8, 0);

            Goal goal = new Goal();
            goal.setId(UUID.randomUUID());
            goal.setUserId(userId);
            goal.setAutoCreateTask(true);
            goal.setGoalType("Time-boxed");

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, date)).thenReturn(Optional.empty());
            when(goalRepo.findByUserIdAndStatus(userId, "In Progress")).thenReturn(List.of(goal));
            when(taskRepo.existsByGoalIdAndDueDate(goal.getId(), date.atStartOfDay(), date.plusDays(1).atStartOfDay()))
                    .thenReturn(true);
            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(AvailableTimeResponse.builder().build());

            service.checkin(userId, date, checkinTime);

            verify(taskRepo, never()).save(any());
        }

        @Test
        @DisplayName("Should skip goal when day of week does not match goal schedule")
        void generateDailyTasks_DayOfWeekMismatch_Skipped() {
            LocalDate sundayDate = LocalDate.of(2026, 8, 2); // Sunday (7)
            LocalTime checkinTime = LocalTime.of(8, 0);

            Goal goal = new Goal();
            goal.setId(UUID.randomUUID());
            goal.setUserId(userId);
            goal.setAutoCreateTask(true);
            goal.setGoalType("Time-boxed");
            goal.setDaysOfWeek("1,2,3,4,5"); // Mon-Fri only

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, sundayDate)).thenReturn(Optional.empty());
            when(goalRepo.findByUserIdAndStatus(userId, "In Progress")).thenReturn(List.of(goal));
            when(availableTimeService.getAvailableTime(userId, sundayDate)).thenReturn(AvailableTimeResponse.builder().build());

            service.checkin(userId, sundayDate, checkinTime);

            verify(taskRepo, never()).save(any());
        }
    }
}
