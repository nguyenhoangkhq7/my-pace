package nhk.stickynote;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sticky-notes")
@RequiredArgsConstructor
public class StickyNoteController {
    private final StickyNoteService stickyNoteService;

    @GetMapping
    public List<StickyNoteDto> getStickyNotes(@AuthenticationPrincipal UserDetailsCustom userDetails) {
        return stickyNoteService.getStickyNotes(userDetails.user().getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StickyNoteDto createStickyNote(@RequestBody StickyNoteCreateRequest request,
                                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return stickyNoteService.createStickyNote(request, userDetails.user().getId());
    }

    @PutMapping("/{id}")
    public StickyNoteDto updateStickyNote(@PathVariable UUID id,
                                           @RequestBody StickyNoteUpdateRequest request,
                                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return stickyNoteService.updateStickyNote(id, request, userDetails.user().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStickyNote(@PathVariable UUID id,
                                  @AuthenticationPrincipal UserDetailsCustom userDetails) {
        stickyNoteService.deleteStickyNote(id, userDetails.user().getId());
    }
}
