package nhk.common;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import nhk.auth.EmailRegistered;
import nhk.auth.InvalidOtp;
import nhk.auth.TokenInvalid;
import nhk.kanban.BoardNotFound;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

   private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, Object data) {
      ErrorResponse response = new ErrorResponse(LocalDateTime.now(), status.value(), message, data);
      return ResponseEntity.status(status).body(response);
   }

   private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
      return buildResponse(status, message, null);
   }

   @ExceptionHandler(MethodArgumentNotValidException.class)
   public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
           MethodArgumentNotValidException exception
   ) {
      var errors = new HashMap<String, String>();
      exception.getBindingResult().getFieldErrors().forEach(e -> {
         errors.put(e.getField(), e.getDefaultMessage());
      });
      return buildResponse(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ", errors);
   }

   @ExceptionHandler(BoardNotFound.class)
   public ResponseEntity<ErrorResponse> handleBoardNotFoundException(BoardNotFound ex) {
      return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
   }

   @ExceptionHandler(EmailRegistered.class)
   public ResponseEntity<ErrorResponse> handleEmailRegisteredException(EmailRegistered ex) {
      return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
   }

   @ExceptionHandler(InvalidOtp.class)
   public ResponseEntity<ErrorResponse> handleInvalidOtpException(InvalidOtp ex) {
      log.error("Error validation OTP: ", ex);
      return buildResponse(HttpStatus.BAD_REQUEST, "OTP not exist or not valid in system");
   }

   @ExceptionHandler(BadCredentialsException.class)
   public ResponseEntity<ErrorResponse> handleBadCredentialsException() {
      return buildResponse(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
   }

   @ExceptionHandler(AccessDeniedException.class)
   public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
      return buildResponse(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng này");
   }

   @ExceptionHandler(EntityNotFoundException.class)
   public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
      return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
   }

   @ExceptionHandler(DataIntegrityViolationException.class)
   public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException ex) {
      log.error("Data Integrity Violation xảy ra: ", ex);
      return buildResponse(HttpStatus.CONFLICT, "Dữ liệu đã tồn tại hoặc vi phạm ràng buộc hệ thống");
   }

   @ExceptionHandler(MailException.class)
   public ResponseEntity<ErrorResponse> handleMailException(MailException ex) {
      log.error("Error sending email: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "There is error while sending email");
   }

   @ExceptionHandler(NullPointerException.class)
   public ResponseEntity<ErrorResponse> handleNullPointerException(NullPointerException ex) {
      log.error("Null Pointer Exception xảy ra: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống null pointer exception");
   }

   @ExceptionHandler({RuntimeException.class, Exception.class})
   public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex) {
      log.error("System Error: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi hệ thống xảy ra, vui lòng thử lại sau");
   }

   @ExceptionHandler({TokenInvalid.class})
   public ResponseEntity<ErrorResponse> handleTokenInvalid(Exception ex) {
      log.error("System Error: ", ex);
      return buildResponse(HttpStatus.UNAUTHORIZED, "Token hết hạn hoặc không hợp lệ");
   }
}