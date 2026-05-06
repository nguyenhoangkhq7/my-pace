package nhk.common;

import lombok.extern.slf4j.Slf4j;
import nhk.kanban.BoardNotFound;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
   @ExceptionHandler(MethodArgumentNotValidException.class)
   public ResponseEntity<Map<String, String>> handleMethodArgumentNotValidException(
           MethodArgumentNotValidException exception
   ) {
      var errors = new HashMap<String, String>();
      exception.getBindingResult().getFieldErrors().forEach(e -> {
         errors.put(e.getField(), e.getDefaultMessage());
      });
      return ResponseEntity.badRequest().body(errors);
   }

   private ResponseEntity<Map<String, Object>> buildResponse(String message, HttpStatus status) {
      Map<String, Object> response = new HashMap<>();
      response.put("timestamp", LocalDateTime.now());
      response.put("status", status.value());
      response.put("message", message);
      return new ResponseEntity<>(response, status);
   }

   @ExceptionHandler(EntityNotFoundException.class)
   public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
      return buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
   }

   @ExceptionHandler(DataIntegrityViolationException.class)
   public ResponseEntity<Map<String, Object>> handleConflict(DataIntegrityViolationException ex) {
      log.error("Data Integrity Violation xảy ra: ", ex);
      return buildResponse("Dữ liệu đã tồn tại hoặc vi phạm ràng buộc hệ thống", HttpStatus.CONFLICT);
   }

   @ExceptionHandler(AccessDeniedException.class)
   public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
      return buildResponse("Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN);
   }

   @ExceptionHandler({RuntimeException.class, Exception.class})
   public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
       log.error("System Error: ", ex);
      return buildResponse("Có lỗi hệ thống xảy ra, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR);
   }

   @ExceptionHandler(NullPointerException.class)
   public ResponseEntity<Map<String, Object>> handleNullPointerException(NullPointerException ex) {
       log.error("Null Pointer Exception xảy ra: ", ex);
      return buildResponse("Lỗi hệ thống null pointer exception", HttpStatus.INTERNAL_SERVER_ERROR);
   }

   @ExceptionHandler(BoardNotFound.class)
   public ProblemDetail handleBoardNotFoundException(BoardNotFound ex) {
      return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
   }
}
