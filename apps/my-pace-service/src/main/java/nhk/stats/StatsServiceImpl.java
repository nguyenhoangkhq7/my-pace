package nhk.stats;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import nhk.calendar.CheckinStreakService;
import nhk.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    @PersistenceContext
    private EntityManager entityManager;
    private final nhk.user.UserRepository userRepository;
    private final nhk.calendar.FixedEventService fixedEventService;
    private final CheckinStreakService checkinStreakService;

    @Override
    @Transactional(readOnly = true)
    public StatsResponse getOverview(UUID userId, String startDateStr, String endDateStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new nhk.common.UserNotFoundException("User not found"));
        java.time.ZoneId userZone = java.time.ZoneId.of(
                user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
        );
        LocalDate today = LocalDate.now(userZone);
        
        LocalDate startDateDate;
        LocalDate endDateDate;

        if (startDateStr != null && endDateStr != null && !startDateStr.isEmpty() && !endDateStr.isEmpty()) {
            try {
                startDateDate = LocalDate.parse(startDateStr);
                endDateDate = LocalDate.parse(endDateStr);
            } catch (Exception e) {
                startDateDate = today.minusDays(30);
                endDateDate = today;
            }
        } else {
            startDateDate = today.minusDays(30);
            endDateDate = today;
        }

        OffsetDateTime startDate = startDateDate.atStartOfDay(userZone).toOffsetDateTime();
        OffsetDateTime endDate = endDateDate.atTime(23, 59, 59, 999999999).atZone(userZone).toOffsetDateTime();

        // 1. Matrix Time
        List<Object[]> matrixResults = entityManager.createQuery(
                "SELECT t.isUrgent, t.isImportant, " +
                "SUM(CASE WHEN t.status = 'Done' THEN COALESCE(NULLIF(t.actualMinutes, 0), NULLIF(t.estimatedMinutes, 0), 25) ELSE t.actualMinutes END) " +
                "FROM Task t " +
                "WHERE t.userId = :userId AND COALESCE(t.doneAt, t.updatedAt) >= :startDate AND COALESCE(t.doneAt, t.updatedAt) <= :endDate " +
                "AND (t.status = 'Done' OR t.actualMinutes > 0) " +
                "GROUP BY t.isUrgent, t.isImportant", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .getResultList();

        Map<String, Integer> matrixTime = new HashMap<>();
        matrixTime.put("q1", 0); // Urgent & Important
        matrixTime.put("q2", 0); // Not Urgent & Important
        matrixTime.put("q3", 0); // Urgent & Not Important
        matrixTime.put("q4", 0); // Not Urgent & Not Important

        for (Object[] row : matrixResults) {
            Boolean isUrgent = (Boolean) row[0];
            Boolean isImportant = (Boolean) row[1];
            Long sumMinutes = (Long) row[2];
            int minutes = sumMinutes != null ? sumMinutes.intValue() : 0;

            if (isUrgent && isImportant) matrixTime.put("q1", minutes);
            else if (!isUrgent && isImportant) matrixTime.put("q2", minutes);
            else if (isUrgent && !isImportant) matrixTime.put("q3", minutes);
            else matrixTime.put("q4", minutes);
        }

        // 2. Category Time
        List<nhk.category.Category> userCategories = entityManager.createQuery(
                "FROM Category c WHERE c.userId = :userId", nhk.category.Category.class)
                .setParameter("userId", user.getId())
                .getResultList();

        Map<String, Integer> categoryTime = new HashMap<>();
        for (nhk.category.Category c : userCategories) {
            categoryTime.put(c.getName(), 0);
        }

        List<Object[]> categoryResults = entityManager.createQuery(
                "SELECT c.name, " +
                "SUM(CASE WHEN t.status = 'Done' THEN COALESCE(NULLIF(t.actualMinutes, 0), NULLIF(t.estimatedMinutes, 0), 25) ELSE t.actualMinutes END) " +
                "FROM Task t LEFT JOIN t.category c " +
                "WHERE t.userId = :userId AND COALESCE(t.doneAt, t.updatedAt) >= :startDate AND COALESCE(t.doneAt, t.updatedAt) <= :endDate " +
                "AND (t.status = 'Done' OR t.actualMinutes > 0) " +
                "GROUP BY c.name", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .getResultList();

        for (Object[] row : categoryResults) {
            String categoryName = row[0] != null ? (String) row[0] : "Chưa phân loại";
            Long sumMinutes = (Long) row[1];
            categoryTime.put(categoryName, sumMinutes != null ? sumMinutes.intValue() : 0);
        }

        // Include duration from Fixed Events in categoryTime
        List<nhk.calendar.FixedEventResponse> fixedEvents = fixedEventService.getEventsInRange(userId, startDateDate, endDateDate);
        for (nhk.calendar.FixedEventResponse fe : fixedEvents) {
            long minutes = java.time.Duration.between(fe.startTime(), fe.endTime()).toMinutes();
            if (minutes > 0) {
                String catName = fe.category() != null ? fe.category().name() : "Chưa phân loại";
                categoryTime.put(catName, categoryTime.getOrDefault(catName, 0) + (int) minutes);
            }
        }

        // 3. Plan Completion Rate
        Long totalPlanTasks = entityManager.createQuery(
                "SELECT COUNT(dpt.id) FROM DailyPlanTask dpt, DailyPlan dp " +
                "WHERE dp.id = dpt.dailyPlanId AND dp.userId = :userId AND dp.planDate >= :startDate AND dp.planDate <= :endDate", Long.class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDateDate)
                .setParameter("endDate", endDateDate)
                .getSingleResult();

        Long donePlanTasks = entityManager.createQuery(
                "SELECT COUNT(dpt.id) FROM DailyPlanTask dpt JOIN dpt.task t, DailyPlan dp " +
                "WHERE dp.id = dpt.dailyPlanId AND dp.userId = :userId AND dp.planDate >= :startDate AND dp.planDate <= :endDate AND t.status = 'Done'", Long.class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDateDate)
                .setParameter("endDate", endDateDate)
                .getSingleResult();

        double completionRate = 0.0;
        if (totalPlanTasks != null && totalPlanTasks > 0) {
            completionRate = (double) (donePlanTasks != null ? donePlanTasks : 0) / totalPlanTasks * 100.0;
        }

        // 4. Streak
        int streak = checkinStreakService.getStreak(userId, userZone);

        // 5. P1 & P2 Extended Metrics: Q2 Focus Ratio, Rollover Rate, Plan vs Actual
        int totalMatrixTime = matrixTime.values().stream().mapToInt(Integer::intValue).sum();
        double q2FocusRatio = totalMatrixTime > 0 ? (matrixTime.getOrDefault("q2", 0) * 100.0) / totalMatrixTime : 0.0;

        long uncompletedPlanTasks = (totalPlanTasks != null ? totalPlanTasks : 0L) - (donePlanTasks != null ? donePlanTasks : 0L);
        double rolloverRate = (totalPlanTasks != null && totalPlanTasks > 0) ? (uncompletedPlanTasks * 100.0) / totalPlanTasks : 0.0;

        List<Object[]> timeResults = entityManager.createQuery(
                "SELECT CAST(dp.planDate AS string), " +
                "SUM(COALESCE(t.estimatedMinutes, 25)), " +
                "SUM(COALESCE(t.actualMinutes, 0)) " +
                "FROM DailyPlanTask dpt JOIN dpt.task t, DailyPlan dp " +
                "WHERE dp.id = dpt.dailyPlanId AND dp.userId = :userId " +
                "AND dp.planDate >= :startDate AND dp.planDate <= :endDate " +
                "GROUP BY dp.planDate " +
                "ORDER BY dp.planDate ASC", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDateDate)
                .setParameter("endDate", endDateDate)
                .getResultList();

        Map<String, int[]> dailyMap = new java.util.LinkedHashMap<>();
        for (Object[] row : timeResults) {
            String dateStr = row[0] != null ? row[0].toString() : "";
            if (dateStr.isEmpty()) continue;
            Long pMin = (Long) row[1];
            Long aMin = (Long) row[2];
            int p = pMin != null ? pMin.intValue() : 0;
            int a = aMin != null ? aMin.intValue() : 0;
            dailyMap.put(dateStr, new int[]{p, a});
        }

        List<Object[]> taskTimeResults = entityManager.createQuery(
                "SELECT COALESCE(t.doneAt, t.updatedAt), " +
                "COALESCE(t.estimatedMinutes, 25), " +
                "COALESCE(t.actualMinutes, 0) " +
                "FROM Task t " +
                "WHERE t.userId = :userId AND COALESCE(t.doneAt, t.updatedAt) >= :startDate AND COALESCE(t.doneAt, t.updatedAt) <= :endDate " +
                "AND (t.status = 'Done' OR t.actualMinutes > 0)", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .getResultList();

        for (Object[] row : taskTimeResults) {
            OffsetDateTime dt = (OffsetDateTime) row[0];
            if (dt == null) continue;
            String dateStr = dt.atZoneSameInstant(userZone).toLocalDate().toString();
            Integer pMin = (Integer) row[1];
            Integer aMin = (Integer) row[2];
            int p = pMin != null ? pMin : 0;
            int a = aMin != null ? aMin : 0;
            if (!dailyMap.containsKey(dateStr)) {
                dailyMap.put(dateStr, new int[]{p, a});
            } else {
                int[] curr = dailyMap.get(dateStr);
                curr[1] = Math.max(curr[1], a);
            }
        }

        List<StatsResponse.DailyTimeStat> dailyTimeStats = new java.util.ArrayList<>();
        int totalPlanned = 0;
        int totalActual = 0;

        for (Map.Entry<String, int[]> entry : dailyMap.entrySet()) {
            int p = entry.getValue()[0];
            int a = entry.getValue()[1];
            totalPlanned += p;
            totalActual += a;
            dailyTimeStats.add(new StatsResponse.DailyTimeStat(entry.getKey(), p, a));
        }

        double estimationAccuracy = 0.0;
        if (totalPlanned > 0) {
            double diffRatio = Math.abs(totalActual - totalPlanned) / (double) totalPlanned;
            estimationAccuracy = Math.max(0.0, (1.0 - diffRatio) * 100.0);
        } else if (totalActual > 0) {
            estimationAccuracy = 100.0;
        }

        return StatsResponse.builder()
                .matrixTime(matrixTime)
                .categoryTime(categoryTime)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .streak(streak)
                .totalPlannedMinutes(totalPlanned)
                .totalActualMinutes(totalActual)
                .estimationAccuracy(Math.round(estimationAccuracy * 10.0) / 10.0)
                .q2FocusRatio(Math.round(q2FocusRatio * 10.0) / 10.0)
                .rolloverRate(Math.round(rolloverRate * 10.0) / 10.0)
                .dailyTimeStats(dailyTimeStats)
                .build();
    }
}
