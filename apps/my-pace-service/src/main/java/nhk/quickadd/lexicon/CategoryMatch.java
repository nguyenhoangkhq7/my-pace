package nhk.quickadd.lexicon;

public record CategoryMatch(
        String category,
        String matchedPhrase,
        int score,
        int startIndex
) {
    public CategoryMatch(String category, String matchedPhrase, int score) {
        this(category, matchedPhrase, score, 0);
    }
}
