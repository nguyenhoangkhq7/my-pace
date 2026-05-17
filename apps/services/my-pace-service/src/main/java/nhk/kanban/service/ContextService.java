package nhk.kanban.service;

import lombok.AllArgsConstructor;
import nhk.kanban.dto.ContextSimpleResponse;
import nhk.kanban.dto.CreateContextRequest;
import nhk.kanban.mapper.ContextMapper;
import nhk.kanban.repository.ContextRepository;
import nhk.user.UserService;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class ContextService {
   private final ContextRepository contextRepository;
   private final ContextMapper contextMapper;
   private final UserService userService;

   public ContextSimpleResponse createMyContext(CreateContextRequest request, Integer userId) {
      var context = contextMapper.toEntity(request);
      context.setUser(userService.getUserProxy(userId));
      return contextMapper.toSimpleResponse(contextRepository.save(context));
   }
}

