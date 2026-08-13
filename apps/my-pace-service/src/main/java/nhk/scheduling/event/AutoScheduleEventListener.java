package nhk.scheduling.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nhk.scheduling.AutoScheduleService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AutoScheduleEventListener {

    private final AutoScheduleService autoScheduleService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleFixedEventChanged(FixedEventChangedEvent event) {
        log.info("AutoScheduleEventListener: Handling FixedEventChangedEvent for user {}", event.userId());
        try {
            autoScheduleService.autoSchedule(event.userId(), null, false);
        } catch (IllegalStateException e) {
            log.debug("Auto-schedule in progress, skipping auto-trigger: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Failed to auto-schedule after FixedEvent change: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskMutated(TaskMutatedEvent event) {
        log.info("AutoScheduleEventListener: Handling TaskMutatedEvent for user {}", event.userId());
        try {
            autoScheduleService.autoSchedule(event.userId(), null, false);
        } catch (IllegalStateException e) {
            log.debug("Auto-schedule in progress, skipping auto-trigger: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Failed to auto-schedule after Task mutation: {}", e.getMessage(), e);
        }
    }
}

