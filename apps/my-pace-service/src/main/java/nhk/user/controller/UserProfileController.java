package nhk.user.controller;

import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.user.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users/profile/notes")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getNotes() {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getNotes()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> updateNotes(@RequestBody Map<String, String> request) {
        String notes = request.get("notes");
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateNotes(notes), "Notes updated successfully"));
    }
}

