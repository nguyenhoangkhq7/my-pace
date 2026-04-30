package nhk.board.service;

import lombok.AllArgsConstructor;
import nhk.board.repository.BoardRepository;
import nhk.entity.Board;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class BoardService {
   private final BoardRepository boardRepository;

   public List<Board> getBoards() {
      return boardRepository.findAll();
   }
}
