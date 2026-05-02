package nhk.kanban;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class BoardService {
   private final BoardRepository boardRepository;

   public List<Board> getBoards() {
      return boardRepository.findAll();
   }

   public Board getBoard(Long id) {
      return boardRepository.findById(id).orElse(null);
   }
}
