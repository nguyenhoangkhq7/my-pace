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
}
