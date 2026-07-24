package nhk.stickynote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StickyNoteRepository extends JpaRepository<StickyNote, UUID> {
    List<StickyNote> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}
