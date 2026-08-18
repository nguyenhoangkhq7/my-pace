package nhk.quickadd.lexicon;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class LexiconManager {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map<Category, List<Phrase>>
    private final Map<String, List<String>> domainLexicon = new HashMap<>();
    private final Map<String, List<String>> strongImportanceLexicon = new HashMap<>();
    private final Map<String, List<String>> urgencyLexicon = new HashMap<>();
    private final Map<String, List<String>> notImportantLexicon = new HashMap<>();
    private final Map<String, List<String>> negationLexicon = new HashMap<>();

    public LexiconManager() {
        loadLexicon("lexicon/" + LexiconType.DOMAIN.getPath(), domainLexicon);
        loadLexicon("lexicon/" + LexiconType.STRONG_IMPORTANCE.getPath(), strongImportanceLexicon);
        loadLexicon("lexicon/" + LexiconType.URGENCY.getPath(), urgencyLexicon);
        loadLexicon("lexicon/" + LexiconType.NOT_IMPORTANT.getPath(), notImportantLexicon);
        loadLexicon("lexicon/" + LexiconType.NEGATION.getPath(), negationLexicon);
    }

    private void loadLexicon(String path, Map<String, List<String>> targetMap) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    Map<String, List<String>> loaded = objectMapper.readValue(is, new TypeReference<>() {});
                    // Normalize all phrases during load
                    for (Map.Entry<String, List<String>> entry : loaded.entrySet()) {
                        List<String> normalizedPhrases = new ArrayList<>();
                        for (String phrase : entry.getValue()) {
                            normalizedPhrases.add(normalize(phrase));
                        }
                        // Sort by length descending for longest-match-first
                        normalizedPhrases.sort((a, b) -> Integer.compare(b.length(), a.length()));
                        targetMap.put(entry.getKey(), normalizedPhrases);
                    }
                }
            } else {
                log.warn("Lexicon file not found: {}", path);
            }
        } catch (Exception e) {
            log.error("Failed to load lexicon: {}", path, e);
        }
    }

    /**
     * Finds matches in the given text for the specified lexicon.
     * Masked parts of the text (e.g. from negations) are ignored.
     */
    public List<CategoryMatch> findMatches(String normalizedText, LexiconType type) {
        Map<String, List<String>> lexicon = switch (type) {
            case DOMAIN -> domainLexicon;
            case STRONG_IMPORTANCE -> strongImportanceLexicon;
            case URGENCY -> urgencyLexicon;
            case NOT_IMPORTANT -> notImportantLexicon;
            case NEGATION -> negationLexicon;
        };

        List<CategoryMatch> matches = new ArrayList<>();
        String remainingText = normalizedText;

        // Iterate through all categories in the lexicon
        for (Map.Entry<String, List<String>> entry : lexicon.entrySet()) {
            String category = entry.getKey();
            for (String phrase : entry.getValue()) {
                if (phrase.isBlank()) continue;
                
                // Use word boundary to avoid partial matches like "thi" in "thiet"
                String regex = "\\b" + Pattern.quote(phrase) + "\\b";
                Pattern pattern = Pattern.compile(regex);
                Matcher matcher = pattern.matcher(remainingText);
                
                while (matcher.find()) {
                    matches.add(new CategoryMatch(category, phrase, getBaseScore(category)));
                    // Mask the matched phrase so it's not matched again by shorter phrases
                    remainingText = remainingText.substring(0, matcher.start()) + 
                                    " ".repeat(phrase.length()) + 
                                    remainingText.substring(matcher.end());
                    matcher = pattern.matcher(remainingText);
                }
            }
        }
        return matches;
    }

    /**
     * Masks out negation phrases from the text so they don't trigger false positives.
     */
    public String maskNegations(String normalizedText, List<CategoryMatch> foundNegations) {
        String maskedText = normalizedText;
        for (CategoryMatch negation : foundNegations) {
            String phrase = negation.matchedPhrase();
            String regex = "\\b" + Pattern.quote(phrase) + "\\b";
            maskedText = maskedText.replaceAll(regex, " ".repeat(phrase.length()));
        }
        return maskedText;
    }

    private int getBaseScore(String category) {
        // Base scoring logic. Can be externalized to JSON as well, but hardcoded here for simplicity based on rules.
        return switch (category) {
            case "MANDATORY", "CRITICAL_CONSEQUENCE", "EXPLICIT_IMPORTANT" -> 100;
            case "GOAL" -> 50;
            case "HEALTH", "FINANCE", "WORK", "EDUCATION", "TECHNOLOGY" -> 50;
            case "PRODUCTIVITY", "FITNESS", "COMMUNITY" -> 50;
            case "TRAVEL" -> 20;
            
            case "DEADLINE", "OVERDUE", "TODAY", "IMMEDIATE", "CRITICAL" -> 100;
            case "TOMORROW" -> 70;
            case "WAITING", "APPOINTMENT" -> 60;
            
            case "ENTERTAINMENT", "GAMING", "SOCIAL_MEDIA", "GOSSIP", "PROCRASTINATION", "PARTY", "LOW_VALUE_REQUEST" -> -50;
            case "NOT_IMPORTANT", "JUST_FOR_FUN" -> -100;
            case "NOT_URGENT" -> -100;
            default -> 10;
        };
    }

    public static String normalize(String s) {
        if (s == null) return "";
        String noTones = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{Mn}", "");
        return noTones.replace("đ", "d").replace("Đ", "D")
                .toLowerCase()
                .replaceAll("\\p{Punct}", " ") // Replace punctuation with space
                .replaceAll("\\s+", " ")       // Collapse multiple spaces
                .trim();
    }

    public enum LexiconType {
        DOMAIN("domain_signals.json"),
        STRONG_IMPORTANCE("strong_importance_signals.json"),
        URGENCY("urgency.json"),
        NOT_IMPORTANT("not_important.json"),
        NEGATION("negation.json");

        private final String path;

        LexiconType(String path) {
            this.path = path;
        }

        public String getPath() {
            return path;
        }
    }
}
