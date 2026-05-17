package nhk.kanban.service;

import lombok.AllArgsConstructor;
import nhk.kanban.dto.CreateTaskRequest;
import nhk.kanban.dto.TaskSimpleResponse;
import nhk.kanban.entity.Task;
import nhk.kanban.exception.BoardColumnNotFound;
import nhk.kanban.exception.BoardColumnNotInBoard;
import nhk.kanban.exception.BoardNotFound;
import nhk.kanban.exception.ContextNotFound;
import nhk.kanban.mapper.TaskMapper;
import nhk.kanban.repository.BoardRepository;
import nhk.kanban.repository.BoardColumnRepository;
import nhk.kanban.repository.ContextRepository;
import nhk.kanban.repository.TaskRepository;
import nhk.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
public class TaskService {
   private final TaskRepository taskRepository;
   private final BoardRepository boardRepository;
   private final BoardColumnRepository boardColumnRepository;
   private final ContextRepository contextRepository;
   private final TaskMapper taskMapper;
   private final UserService userService;

   @Transactional
   public TaskSimpleResponse createMyTask(CreateTaskRequest request, Integer userId) {

      var board = boardRepository
              .findByIdAndUserId(request.getBoardId(), userId)
              .orElseThrow(() -> new BoardNotFound("Board not found"));

      var column = boardColumnRepository
              .findByIdAndBoardId(
                      request.getColumnId(),
                      board.getId()
              )
              .orElseThrow(() -> new BoardColumnNotFound(
                      "Column not found in this board"
              ));

      Task task = new Task();

      taskMapper.updateEntity(request, task);

      task.setUser(userService.getUserProxy(userId));
      task.setColumn(column);

      if (request.getContextId() != null) {
         var context = contextRepository
                 .findByIdAndUserId(
                         request.getContextId(),
                         userId
                 )
                 .orElseThrow(() -> new ContextNotFound(
                         "Context not found"
                 ));

         task.setContext(context);
      }

      taskRepository.save(task);

      return taskMapper.toSimpleResponse(task);
   }
}


