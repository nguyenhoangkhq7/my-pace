package nhk.quickadd;

import nhk.category.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryResolverTest {

    private CategoryResolver categoryResolver;
    private Category projectCaNhan;
    private Category hocTap;

    @BeforeEach
    void setUp() {
        categoryResolver = new CategoryResolver();
        projectCaNhan = new Category();
        projectCaNhan.setId(UUID.randomUUID());
        projectCaNhan.setName("Project cá nhân");
        projectCaNhan.setColor("#3b82f6");

        hocTap = new Category();
        hocTap.setId(UUID.randomUUID());
        hocTap.setName("Học tập");
        hocTap.setColor("#10b981");
    }

    @Test
    @DisplayName("De-underscores hashtag hint: #Project_cá_nhân → Project cá nhân UUID")
    void testDeUnderscoredHashtag() {
        UUID id = categoryResolver.resolve("Project_cá_nhân", List.of(projectCaNhan, hocTap));
        assertThat(id).isEqualTo(projectCaNhan.getId());
    }

    @Test
    @DisplayName("Hashtag with leading # and underscores: #Project_cá_nhân")
    void testLeadingHashAndUnderscores() {
        UUID id = categoryResolver.resolve("#Project_cá_nhân", List.of(projectCaNhan, hocTap));
        assertThat(id).isEqualTo(projectCaNhan.getId());
    }

    @Test
    @DisplayName("Diacritic-insensitive match: #project_ca_nhan")
    void testDiacriticInsensitive() {
        UUID id = categoryResolver.resolve("project_ca_nhan", List.of(projectCaNhan, hocTap));
        assertThat(id).isEqualTo(projectCaNhan.getId());
    }

    @Test
    @DisplayName("In-text scan: Name in sentence → Học tập UUID")
    void testResolveFromText() {
        UUID id = categoryResolver.resolveFromText("Thời gian dành cho Học tập hôm nay", List.of(projectCaNhan, hocTap));
        assertThat(id).isEqualTo(hocTap.getId());
    }

    @Test
    @DisplayName("Domain fallback: HEALTH signal → Sức khỏe Category UUID")
    void testResolveFromDomainHealth() {
        Category sucKhoe = new Category();
        sucKhoe.setId(UUID.randomUUID());
        sucKhoe.setName("Sức khỏe");
        sucKhoe.setColor("#ef4444");

        UUID id = categoryResolver.resolveFromDomain(
                List.of(new nhk.quickadd.lexicon.CategoryMatch("HEALTH", "khám răng", 50)),
                List.of(projectCaNhan, hocTap, sucKhoe)
        );
        assertThat(id).isEqualTo(sucKhoe.getId());
    }

    @Test
    @DisplayName("Domain fallback: EDUCATION signal → Học tập Category UUID")
    void testResolveFromDomainEducation() {
        UUID id = categoryResolver.resolveFromDomain(
                List.of(new nhk.quickadd.lexicon.CategoryMatch("EDUCATION", "ôn bài", 50)),
                List.of(projectCaNhan, hocTap)
        );
        assertThat(id).isEqualTo(hocTap.getId());
    }

    @Test
    @DisplayName("Domain fallback: WORK signal → Project cá nhân or Work Category UUID")
    void testResolveFromDomainWork() {
        Category congViec = new Category();
        congViec.setId(UUID.randomUUID());
        congViec.setName("Công việc");
        congViec.setColor("#3b82f6");

        UUID id = categoryResolver.resolveFromDomain(
                List.of(new nhk.quickadd.lexicon.CategoryMatch("WORK", "họp team", 50)),
                List.of(projectCaNhan, hocTap, congViec)
        );
        assertThat(id).isEqualTo(congViec.getId());
    }
}
