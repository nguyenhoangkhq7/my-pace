package nhk.user;

import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.scheduling.AutoScheduleService;
import nhk.timeblock.TaskTimeBlockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AutoScheduleService autoScheduleService;
    private final TaskTimeBlockRepository taskTimeBlockRepository;

    @Transactional
    public UserSimpleResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        java.time.LocalTime oldWake = user.getWakeTime();
        java.time.LocalTime oldSleep = user.getSleepTime();

        userMapper.updateFromUpdateRequest(request, user);
        User savedUser = userRepository.save(user);

        if (!Objects.equals(oldWake, savedUser.getWakeTime()) || !Objects.equals(oldSleep, savedUser.getSleepTime())) {
            ZoneId zoneId = ZoneId.of(savedUser.getTimezone() != null ? savedUser.getTimezone() : "UTC");
            java.time.LocalDateTime todayStart = LocalDate.now(zoneId).atStartOfDay();
            taskTimeBlockRepository.deleteFreeUnlockedBlocksFrom(userId, todayStart);
            try {
                autoScheduleService.autoSchedule(userId, user.getBufferMinutes(), false);
            } catch (Exception ignored) {}
        }

        return userMapper.toUserSimpleResponse(savedUser);
    }
}
