package nhk.quickadd;

import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FastPathVietnameseRealWorldTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Mock private CategoryRepository categoryRepository;
    @Mock private GoalRepository goalRepository;

    private QuickAddService quickAddService;

    // Categories của một user thực tế (Sinh viên / Người đi làm)
    private Category catHocTap;
    private Category catCongViec;
    private Category catSucKhoe;
    private Category catTaiChinh;
    private Category catMuaSam;
    private Category catNhaCua;
    private Category catGiaiTri;

    // Goals
    private Goal goalKLTN;
    private Goal goalIELTS;

    @BeforeEach
    void setUp() {
        // Tạo các category mẫu
        catHocTap = new Category();
        catHocTap.setId(UUID.randomUUID());
        catHocTap.setName("Học tập");

        catCongViec = new Category();
        catCongViec.setId(UUID.randomUUID());
        catCongViec.setName("Công việc");

        catSucKhoe = new Category();
        catSucKhoe.setId(UUID.randomUUID());
        catSucKhoe.setName("Sức khỏe");

        catTaiChinh = new Category();
        catTaiChinh.setId(UUID.randomUUID());
        catTaiChinh.setName("Tài chính");

        catMuaSam = new Category();
        catMuaSam.setId(UUID.randomUUID());
        catMuaSam.setName("Mua sắm");

        catNhaCua = new Category();
        catNhaCua.setId(UUID.randomUUID());
        catNhaCua.setName("Nhà cửa");

        catGiaiTri = new Category();
        catGiaiTri.setId(UUID.randomUUID());
        catGiaiTri.setName("Giải trí");

        // Tạo các goal mẫu
        goalKLTN = new Goal();
        goalKLTN.setId(UUID.randomUUID());
        goalKLTN.setTitle("Khóa luận tốt nghiệp");
        goalKLTN.setCategoryId(catHocTap.getId());

        goalIELTS = new Goal();
        goalIELTS.setId(UUID.randomUUID());
        goalIELTS.setTitle("IELTS 7.5");
        goalIELTS.setCategoryId(catHocTap.getId());

        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(
                List.of(catHocTap, catCongViec, catSucKhoe, catTaiChinh, catMuaSam, catNhaCua, catGiaiTri)
        );
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(
                List.of(goalKLTN, goalIELTS)
        );

        quickAddService = new QuickAddService(
                categoryRepository,
                goalRepository,
                new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(),
                new UserContextVersionService(),
                new ExtractionSchemaValidator(),
                new ExtractionSemanticValidator(),
                new FastPathParser(),
                "test-key",
                "test-model",
                null
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CẤP ĐỘ 1: DỄ (EASY) - Cú pháp chuẩn, thời gian rõ ràng, domain signals cơ bản
    // ─────────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Cấp độ 1: Dễ - Câu cơ bản của sinh viên & người đi làm")
    class EasyCases {

        @Test
        @DisplayName("Sinh viên: Ôn thi giải tích 1 19h tối nay 2 tiếng")
        void testStudent_OnThiGiaiTich() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Ôn thi giải tích 1 19h tối nay 2 tiếng"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Ôn thi giải tích 1");
            assertThat(res.estimatedMinutes()).isEqualTo(120);
            assertThat(res.categoryId()).isEqualTo(catHocTap.getId());
        }

        @Test
        @DisplayName("Người đi làm: Họp team backend lúc 9h sáng mai 1 tiếng")
        void testWorker_HopTeamBackend() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Họp team backend lúc 9h sáng mai 1 tiếng"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Họp team backend");
            assertThat(res.type()).isEqualTo("event");
            assertThat(res.startTime()).isEqualTo("09:00");
            assertThat(res.endTime()).isEqualTo("10:00");
            assertThat(res.categoryId()).isEqualTo(catCongViec.getId());
        }

        @Test
        @DisplayName("Đời sống: Khám răng lúc 8h sáng mai")
        void testLife_KhamRang() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Khám răng lúc 8h sáng mai"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Khám răng");
            assertThat(res.startTime()).isEqualTo("08:00");
            assertThat(res.categoryId()).isEqualTo(catSucKhoe.getId());
        }

        @Test
        @DisplayName("Mua sắm: Đi siêu thị mua rau 17h")
        void testShopping_DieuThi() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Đi siêu thị mua rau 17h"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Đi siêu thị mua rau");
            assertThat(res.categoryId()).isEqualTo(catMuaSam.getId());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CẤP ĐỘ 2: TRUNG BÌNH (MEDIUM) - Acronym Mục tiêu, từ ngữ đời sống thực tế
    // ─────────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Cấp độ 2: Trung bình - Acronym Goal, Deadline, Đời sống thực tế")
    class MediumCases {

        @Test
        @DisplayName("Sinh viên: Làm slide KLTN tối nay 3 tiếng (Goal Acronym + Category Inheritance)")
        void testStudent_KLTNAcronym() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Làm slide KLTN tối nay 3 tiếng"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.goalId()).isEqualTo(goalKLTN.getId());
            assertThat(res.categoryId()).isEqualTo(catHocTap.getId());
            assertThat(res.estimatedMinutes()).isEqualTo(180);
        }

        @Test
        @DisplayName("IT / Công sở: Fix bug thanh toán gấp trước 12h trưa")
        void testWorker_FixBugThanhToanGap() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Fix bug thanh toán gấp trước 12h trưa"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.categoryId()).isEqualTo(catCongViec.getId());
            assertThat(res.isUrgent()).isTrue();
        }

        @Test
        @DisplayName("Y tế sinh viên: Nhổ răng khôn lúc 14h chiều thứ 6")
        void testLife_NhoRangKhon() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Nhổ răng khôn lúc 14h chiều thứ 6"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Nhổ răng khôn");
            assertThat(res.startTime()).isEqualTo("14:00");
            assertThat(res.categoryId()).isEqualTo(catSucKhoe.getId());
        }

        @Test
        @DisplayName("Tài chính: Đóng tiền điện tháng này 20h")
        void testFinance_DongTienDien() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Đóng tiền điện tháng này 20h"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Đóng tiền điện tháng này");
            assertThat(res.categoryId()).isEqualTo(catTaiChinh.getId());
        }

        @Test
        @DisplayName("Thể thao: Đánh cầu lông 18h-20h tối mai")
        void testSport_DanhCauLong() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Đánh cầu lông 18h-20h tối mai"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.type()).isEqualTo("event");
            assertThat(res.startTime()).isEqualTo("18:00");
            assertThat(res.endTime()).isEqualTo("20:00");
            assertThat(res.categoryId()).isEqualTo(catSucKhoe.getId());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CẤP ĐỘ 3: KHÓ (HARD) - Đảo trật tự ngữ pháp, Inline Checklist, Từ lóng
    // ─────────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Cấp độ 3: Khó - Đảo ngữ, Inline Checklist, Từ vựng chuyên sâu")
    class HardCases {

        @Test
        @DisplayName("Đảo thời gian lên đầu: Sáng mai 7h30 học đại số tuyến tính")
        void testTimeFirst_HocDaiSo() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Sáng mai 7h30 học đại số tuyến tính"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Học đại số tuyến tính");
            assertThat(res.plannedStartTime()).contains("07:30");
            assertThat(res.categoryId()).isEqualTo(catHocTap.getId());
        }

        @Test
        @DisplayName("Đảo thời lượng vào giữa: Đi bách hóa xanh 1 tiếng mua rau tối nay")
        void testDurationMiddle_BachHoaXanh() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Đi bách hóa xanh 1 tiếng mua rau tối nay"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.estimatedMinutes()).isEqualTo(60);
            assertThat(res.categoryId()).isEqualTo(catMuaSam.getId());
        }

        @Test
        @DisplayName("Inline Checklist việc nhà: Dọn phòng: lau bàn, hút bụi, giặt quần áo")
        void testInlineChecklist_DonPhong() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Dọn phòng: lau bàn, hút bụi, giặt quần áo"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Dọn phòng");
            assertThat(res.checklists()).hasSize(3);
            assertThat(res.checklists().get(0).title()).isEqualTo("Lau bàn");
            assertThat(res.checklists().get(1).title()).isEqualTo("Hút bụi");
            assertThat(res.checklists().get(2).title()).isEqualTo("Giặt quần áo");
            assertThat(res.categoryId()).isEqualTo(catNhaCua.getId());
        }

        @Test
        @DisplayName("Deadline sát nút: Nộp báo cáo tuần trước 17h chiều mai")
        void testDeadline_NopBaoCaoTuan() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Nộp báo cáo tuần trước 17h chiều mai"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.title()).containsIgnoringCase("Nộp báo cáo tuần");
            assertThat(res.dueDate()).isNotNull();
            assertThat(res.categoryId()).isEqualTo(catCongViec.getId());
            assertThat(res.isUrgent()).isTrue();
        }

        @Test
        @DisplayName("Luyện thi chứng chỉ: Tối nay 8h học IELTS 45 phút")
        void testCertification_IELTS() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Tối nay 8h học IELTS 45 phút"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.goalId()).isEqualTo(goalIELTS.getId());
            assertThat(res.categoryId()).isEqualTo(catHocTap.getId());
            assertThat(res.estimatedMinutes()).isEqualTo(45);
        }

        @Test
        @DisplayName("Giải trí phủ định (Q4): Chơi liên quân 30p tối nay không gấp")
        void testEntertainment_ChoiLienQuan() {
            QuickAddResponse res = quickAddService.parse(
                    new QuickAddRequest("Chơi liên quân 30p tối nay không gấp"),
                    USER_ID, "Asia/Ho_Chi_Minh"
            );

            assertThat(res.source()).isEqualTo("FAST_PATH");
            assertThat(res.estimatedMinutes()).isEqualTo(30);
            assertThat(res.categoryId()).isEqualTo(catGiaiTri.getId());
            assertThat(res.isImportant()).isFalse();
            assertThat(res.isUrgent()).isFalse();
            assertThat(res.quadrant()).isEqualTo("Q4");
        }
    }
}
