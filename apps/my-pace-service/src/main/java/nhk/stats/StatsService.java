package nhk.stats;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import nhk.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatsService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public StatsResponse getOverview(User user) {
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);
        LocalDate thirtyDaysAgoDate = LocalDate.now().minusDays(30);

        // 1. Matrix Time
        List<Object[]> matrixResults = entityManager.createQuery(
                "SELECT t.isUrgent, t.isImportant, SUM(t.actualMinutes) " +
                "FROM Task t " +
                "WHERE t.userId = :userId AND t.updatedAt >= :startDate AND t.actualMinutes > 0 " +
                "GROUP BY t.isUrgent, t.isImportant", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", thirtyDaysAgo)
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
                "SELECT c.name, SUM(t.actualMinutes) " +
                "FROM Task t LEFT JOIN t.category c " +
                "WHERE t.userId = :userId AND t.updatedAt >= :startDate AND t.actualMinutes > 0 " +
                "GROUP BY c.name", Object[].class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", thirtyDaysAgo)
                .getResultList();

        for (Object[] row : categoryResults) {
            String categoryName = row[0] != null ? (String) row[0] : "Chưa phân loại";
            Long sumMinutes = (Long) row[1];
            categoryTime.put(categoryName, sumMinutes != null ? sumMinutes.intValue() : 0);
        }

        // 3. Plan Completion Rate
        Long totalPlanTasks = entityManager.createQuery(
                "SELECT COUNT(dpt.id) FROM DailyPlanTask dpt, DailyPlan dp " +
                "WHERE dp.id = dpt.dailyPlanId AND dp.userId = :userId AND dp.planDate >= :startDate", Long.class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", thirtyDaysAgoDate)
                .getSingleResult();

        Long donePlanTasks = entityManager.createQuery(
                "SELECT COUNT(dpt.id) FROM DailyPlanTask dpt JOIN dpt.task t, DailyPlan dp " +
                "WHERE dp.id = dpt.dailyPlanId AND dp.userId = :userId AND dp.planDate >= :startDate AND t.status = 'Done'", Long.class)
                .setParameter("userId", user.getId())
                .setParameter("startDate", thirtyDaysAgoDate)
                .getSingleResult();

        double completionRate = 0.0;
        if (totalPlanTasks != null && totalPlanTasks > 0) {
            completionRate = (double) (donePlanTasks != null ? donePlanTasks : 0) / totalPlanTasks * 100.0;
        }

        // 4. Streak
        List<LocalDate> checkinDates = entityManager.createQuery(
                "SELECT dc.checkinDate FROM DailyCheckin dc " +
                "WHERE dc.user.id = :userId " +
                "ORDER BY dc.checkinDate DESC", LocalDate.class)
                .setParameter("userId", user.getId())
                .getResultList();

        int streak = 0;
        LocalDate today = LocalDate.now(java.time.ZoneId.of(user.getTimezone()));
        LocalDate current = today;
        
        // If they haven't checked in today yet, the streak could still be alive if they checked in yesterday
        boolean foundToday = false;
        boolean foundYesterday = false;
        
        for (LocalDate d : checkinDates) {
            if (d.equals(today)) {
                foundToday = true;
            } else if (d.equals(today.minusDays(1))) {
                foundYesterday = true;
            }
        }
        
        if (foundToday) {
            current = today;
        } else if (foundYesterday) {
            current = today.minusDays(1);
        } else {
            // Streak broken
        }
        
        if (foundToday || foundYesterday) {
            for (LocalDate d : checkinDates) {
                if (d.equals(current)) {
                    streak++;
                    current = current.minusDays(1);
                } else if (d.isBefore(current)) {
                    break;
                }
            }
        }

        return StatsResponse.builder()
                .matrixTime(matrixTime)
                .categoryTime(categoryTime)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .streak(streak)
                .build();
    }
}
