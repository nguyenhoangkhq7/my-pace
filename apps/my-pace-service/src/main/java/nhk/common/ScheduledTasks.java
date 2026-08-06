package nhk.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nhk.auth.OtpRepository;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final OtpRepository otpRepository;

    @Scheduled(cron = "0 0 2 1 * *") // Chạy vào lúc 2:00 sáng ngày mùng 1 hàng tháng
    @Transactional
    public void deleteExpiredOtps() {
        log.info("Running scheduled task to delete expired OTPs");
        try {
            otpRepository.deleteExpiredOtps(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to delete expired OTPs", e);
        }
    }
}
