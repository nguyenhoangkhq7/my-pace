package nhk.user.service;

import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.user.User;
import nhk.user.UserNote;
import nhk.user.UserNoteRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserNoteRepository userNoteRepository;

    @Transactional(readOnly = true)
    public Map<String, String> getNotes() {
        User currentUser = getCurrentUser();
        String notes = userNoteRepository.findById(currentUser.getId())
                .map(UserNote::getNotes)
                .orElse("");
        return Map.of("notes", notes);
    }

    @Transactional
    public Map<String, String> updateNotes(String notes) {
        User currentUser = getCurrentUser();
        String normalizedNotes = notes == null ? "" : notes;
        UserNote userNote = userNoteRepository.findById(currentUser.getId())
                .orElseGet(() -> {
                    UserNote note = new UserNote();
                    note.setUser(currentUser);
                    note.setId(currentUser.getId());
                    return note;
                });
        userNote.setNotes(normalizedNotes);
        userNoteRepository.save(userNote);
        return Map.of("notes", normalizedNotes);
    }

    private User getCurrentUser() {
        return SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("Unable to resolve current user"));
    }
}






