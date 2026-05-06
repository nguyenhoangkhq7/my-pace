package nhk.kanban;

import lombok.AllArgsConstructor;
import nhk.user.UserService;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class BoardService {
   private final BoardRepository boardRepository;
   private final BoardMapper boardMapper;
   private final UserService userService;

   public List<BoardSimpleResponse> getMyBoards(Integer userId) {
      var boards = boardRepository.getBoardsByUserId(userId).orElseThrow(() -> new BoardNotFound("Boards not found"));
      return boardMapper.toListSimpleResponse(boards);
   }

   public BoardSimpleResponse getMyBoard(Integer id, Integer userId) {
      var board = boardRepository.findByIdAndUserId(id, userId).orElseThrow(() -> new BoardNotFound("Board not found"));
      return boardMapper.toSimpleResponse(board);
   }

   public BoardSimpleResponse createMyBoard(CreateBoardRequest request, Integer userId) {
      var board = boardMapper.toEntity(request);
      var userProxy = userService.getUserProxy(userId);
      board.setUser(userProxy);
      return boardMapper.toSimpleResponse(boardRepository.save(board));
   }

   public void deleteMyBoard(Integer userId, Integer id) {
      var board = boardRepository.findByIdAndUserId(id, userId)
              .orElseThrow(() -> new BoardNotFound("Board not found or you don't have permission"));
      boardRepository.delete(board);
   }
}
