package nhk.quickadd;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Structural / schema validator for AI extractions.
 * Ensures JSON format correctness, required fields, and valid primitive ranges.
 */
@Component
public class ExtractionSchemaValidator {

    private static final Set<String> VALID_INTENTS = Set.of(
            "open_task", "deadline", "time_block", "task", "event"
    );

    private static final int MAX_CHECKLIST_ITEMS = 50;

    /**
     * Parses and validates raw JsonNode from Groq LLM response.
     */
    public AiExtraction validate(JsonNode node) {
        if (node == null || node.isNull()) {
            throw new QuickAddParseException("Extraction payload is empty");
        }

        String reasoning = readText(node, "reasoning");

        String title = readText(node, "title");
        if (title == null || title.isBlank()) {
            throw new QuickAddParseException("AI failed to extract required 'title' field");
        }
        title = title.trim();
        if (title.length() > 255) {
            title = title.substring(0, 255).trim();
        }

        String rawIntent = readText(node, "intent");
        String normalizedIntent = normalizeIntent(rawIntent);

        List<String> checklists = parseChecklists(node.get("checklists"));

        boolean allDayHint = readBoolean(node, "isAllDay");

        Double iScore = clampScore(readDoubleOptional(node, "i"));
        Double uScore = clampScore(readDoubleOptional(node, "u"));

        return new AiExtraction(
                reasoning,
                normalizedIntent,
                title,
                readText(node, "dateExpression"),
                readText(node, "timeExpression"),
                readText(node, "durationExpression"),
                readText(node, "categoryHint"),
                readText(node, "goalHint"),
                readText(node, "notes"),
                checklists.isEmpty() ? null : checklists,
                allDayHint,
                readText(node, "recurrenceExpression"),
                iScore,
                uScore
        );
    }

    private String normalizeIntent(String raw) {
        if (raw == null || raw.isBlank()) return "open_task";
        String lower = raw.trim().toLowerCase();
        if (VALID_INTENTS.contains(lower)) {
            return lower;
        }
        return "open_task";
    }

    private List<String> parseChecklists(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> items = new ArrayList<>();
        for (JsonNode item : node) {
            if (items.size() >= MAX_CHECKLIST_ITEMS) break;
            String text = item.isTextual() ? item.asText(null) : readText(item, "title");
            if (text != null && !text.isBlank()) {
                items.add(text.trim());
            }
        }
        return items;
    }

    private Double clampScore(Double score) {
        if (score == null || score.isNaN() || score.isInfinite()) return null;
        return Math.max(0.0, Math.min(1.0, score));
    }

    private String readText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode f = node.get(field);
        if (f == null || f.isNull()) return null;
        String value = f.asText(null);
        return value != null && !value.isBlank() ? value.trim() : null;
    }

    private boolean readBoolean(JsonNode node, String field) {
        if (node == null) return false;
        JsonNode f = node.get(field);
        return f != null && !f.isNull() && f.asBoolean(false);
    }

    private Double readDoubleOptional(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode f = node.get(field);
        if (f == null || f.isNull() || !f.isNumber()) return null;
        return f.asDouble();
    }
}
