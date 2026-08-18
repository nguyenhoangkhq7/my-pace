package nhk.quickadd;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class DateResolverTest {

    private DateResolver dateResolver;
    private ZonedDateTime now;

    @BeforeEach
    void setUp() {
        dateResolver = new DateResolver();
        now = ZonedDateTime.of(2026, 8, 18, 9, 30, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    @Test
    @DisplayName("Time ranges like '1-3 giờ chiều', '1-3h', '9-11h' must NOT resolve to dates")
    void resolve_TimeRanges_ShouldReturnNull() {
        assertThat(dateResolver.resolve("1-3 giờ chiều", now)).isNull();
        assertThat(dateResolver.resolve("1-3h", now)).isNull();
        assertThat(dateResolver.resolve("9-11h", now)).isNull();
        assertThat(dateResolver.resolve("1-3", now)).isNull();
        assertThat(dateResolver.resolve("1/3 gio chieu", now)).isNull();
    }

    @Test
    @DisplayName("Explicit date formats with 'ngày' or slash resolve properly")
    void resolve_ExplicitDates() {
        assertThat(dateResolver.resolve("ngay 1-3", now)).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(dateResolver.resolve("ngay 15/8", now)).isEqualTo(LocalDate.of(2026, 8, 15));
        assertThat(dateResolver.resolve("15/8", now)).isEqualTo(LocalDate.of(2026, 8, 15));
        assertThat(dateResolver.resolve("15/8/2026", now)).isEqualTo(LocalDate.of(2026, 8, 15));
        assertThat(dateResolver.resolve("15-8-2026", now)).isEqualTo(LocalDate.of(2026, 8, 15));
        assertThat(dateResolver.resolve("ngày 20 tháng 10", now)).isEqualTo(LocalDate.of(2026, 10, 20));
    }

    @Test
    @DisplayName("Relative date keywords resolve correctly")
    void resolve_RelativeDates() {
        assertThat(dateResolver.resolve("hôm nay", now)).isEqualTo(LocalDate.of(2026, 8, 18));
        assertThat(dateResolver.resolve("ngày mai", now)).isEqualTo(LocalDate.of(2026, 8, 19));
        assertThat(dateResolver.resolve("mai", now)).isEqualTo(LocalDate.of(2026, 8, 19));
        assertThat(dateResolver.resolve("ngày mốt", now)).isEqualTo(LocalDate.of(2026, 8, 20));
        assertThat(dateResolver.resolve("3 ngày nữa", now)).isEqualTo(LocalDate.of(2026, 8, 21));
    }
}
