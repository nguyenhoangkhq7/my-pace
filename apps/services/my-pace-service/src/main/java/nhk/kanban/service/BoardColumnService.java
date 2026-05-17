package nhk.kanban.service;

import lombok.AllArgsConstructor;
import nhk.kanban.dto.BoardColumnSimpleResponse;
import nhk.kanban.mapper.BoardColumnMapper;
import nhk.kanban.dto.CreateBoardColumnRequest;
import nhk.kanban.exception.BoardNotFound;
import nhk.kanban.repository.BoardColumnRepository;
import nhk.kanban.repository.BoardRepository;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class BoardColumnService {
   private final BoardColumnRepository boardColumnRepository;
   private final BoardRepository boardRepository;
   private final BoardColumnMapper boardColumnMapper;

   public BoardColumnSimpleResponse createMyBoardColumn(CreateBoardColumnRequest request, Integer userId) {
      var board = boardRepository.findByIdAndUserId(request.getBoardId(), userId)
              .orElseThrow(() -> new BoardNotFound("Board not found"));

      var boardColumn = boardColumnMapper.toEntity(request);
      boardColumn.setBoard(board);
      return boardColumnMapper.toSimpleResponse(boardColumnRepository.save(boardColumn));
   }
}

