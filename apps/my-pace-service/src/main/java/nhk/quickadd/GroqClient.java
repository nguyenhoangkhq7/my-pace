package nhk.quickadd;

import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Thin HTTP client for the Groq Chat Completions API.
 * Handles only transport concerns: auth header, JSON payload, response unwrapping.
 * All business logic lives in QuickAddService.
 */
class GroqClient {

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    GroqClient(RestClient restClient, String apiKey, String model) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * Sends messages to Groq and returns the raw content string from the first choice.
     *
     * @throws QuickAddExternalServiceException on HTTP / response parsing failure
     */
    String complete(List<Map<String, Object>> messages, double temperature) {
        Map<String, Object> payload = Map.of(
                "model", model,
                "messages", messages,
                "temperature", temperature,
                "max_tokens", 700,
                "response_format", Map.of("type", "json_object")
        );

        try {
            Map<?, ?> response = restClient.post()
                    .uri(GROQ_API_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            return unwrapContent(response);
        } catch (QuickAddExternalServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new QuickAddExternalServiceException("AI service unavailable", e);
        }
    }

    private String unwrapContent(Map<?, ?> response) {
        if (response == null) throw new QuickAddExternalServiceException("Empty AI response");

        Object choicesObj = response.get("choices");
        if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
            throw new QuickAddExternalServiceException("Empty AI response");
        }
        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choiceMap)) {
            throw new QuickAddExternalServiceException("Empty AI response");
        }
        Object messageObj = choiceMap.get("message");
        if (!(messageObj instanceof Map<?, ?> messageMap)) {
            throw new QuickAddExternalServiceException("Empty AI response");
        }
        Object contentObj = messageMap.get("content");
        if (!(contentObj instanceof String content) || content.isBlank()) {
            throw new QuickAddExternalServiceException("Empty AI response");
        }
        return content;
    }
}
