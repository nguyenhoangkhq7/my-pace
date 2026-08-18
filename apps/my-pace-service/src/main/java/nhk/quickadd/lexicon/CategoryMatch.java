package nhk.quickadd.lexicon;

public record CategoryMatch(
        String category,
        String matchedPhrase,
        int score
) {}
