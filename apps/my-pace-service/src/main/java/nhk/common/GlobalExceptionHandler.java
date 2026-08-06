package nhk.common;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import nhk.auth.EmailAlreadyRegisteredException;
import nhk.auth.InvalidOtpException;
import nhk.auth.InvalidTokenException;
import nhk.goal.GoalLimitExceededException;
import nhk.mail.EmailSendingException;
import nhk.quickadd.QuickAddExternalServiceException;
import nhk.quickadd.QuickAddParseException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
      exception.getBindingResult().getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
      return buildResponse(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ", errors);
   }

   @ExceptionHandler(EmailAlreadyRegisteredException.class)
   public ResponseEntity<ErrorResponse> handleEmailRegisteredException(EmailAlreadyRegisteredException ex) {
      return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
   }

   @ExceptionHandler(InvalidOtpException.class)
   public ResponseEntity<ErrorResponse> handleInvalidOtpException(InvalidOtpException ex) {
      log.error("Error validation OTP: ", ex);
      return buildResponse(HttpStatus.BAD_REQUEST, "OTP not exist or not valid in system");
   }

   @ExceptionHandler({BadCredentialsException.class, org.springframework.security.core.AuthenticationException.class})
   public ResponseEntity<ErrorResponse> handleBadCredentialsException(Exception ex) {
      log.warn("Authentication failed: {}", ex.getMessage());
      return buildResponse(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
   }

   @ExceptionHandler(AccessDeniedException.class)
   public ResponseEntity<ErrorResponse> handleAccessDenied() {
      return buildResponse(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng này");
   }

    @ExceptionHandler({
            EntityNotFoundException.class,
            UserNotFoundException.class,
            EventNotFoundException.class,
            CategoryNotFoundException.class,
            GoalNotFoundException.class,
            TimeContextNotFoundException.class
    })
    public ResponseEntity<ErrorResponse> handleNotFound(Exception ex) {
       return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(GoalLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleGoalLimitExceeded(GoalLimitExceededException ex) {
       return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

   @ExceptionHandler(DataIntegrityViolationException.class)
   public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException ex) {
      log.error("Data Integrity Violation xảy ra: ", ex);
      return buildResponse(HttpStatus.CONFLICT, "Dữ liệu đã tồn tại hoặc vi phạm ràng buộc hệ thống");
   }

   @ExceptionHandler(IllegalArgumentException.class)
   public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
      return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
   }

   @ExceptionHandler(IllegalStateException.class)
   public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
      return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
   }

   @ExceptionHandler(EmailSendingException.class)
   public ResponseEntity<ErrorResponse> handleEmailSendingException(EmailSendingException ex) {
      log.error("Error sending email: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "There is error while sending email");
   }

   @ExceptionHandler(QuickAddExternalServiceException.class)
   public ResponseEntity<ErrorResponse> handleQuickAddExternalServiceException(QuickAddExternalServiceException ex) {
      log.error("Quick add external service error: ", ex);
      return buildResponse(HttpStatus.BAD_GATEWAY, ex.getMessage());
   }

   @ExceptionHandler(QuickAddParseException.class)
   public ResponseEntity<ErrorResponse> handleQuickAddParseException(QuickAddParseException ex) {
      log.error("Quick add parse error: ", ex);
      return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
   }

   @ExceptionHandler(NullPointerException.class)
   public ResponseEntity<ErrorResponse> handleNullPointerException(NullPointerException ex) {
      log.error("Null Pointer Exception xảy ra: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống null pointer exception");
   }

   @ExceptionHandler(InvalidTokenException.class)
   public ResponseEntity<ErrorResponse> handleTokenInvalid(InvalidTokenException ex) {
      log.error("Token invalid: ", ex);
      return buildResponse(HttpStatus.UNAUTHORIZED, "Token hết hạn hoặc không hợp lệ");
   }

   @ExceptionHandler({RuntimeException.class, Exception.class})
   public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex) {
      log.error("System Error: ", ex);
      return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi hệ thống xảy ra, vui lòng thử lại sau");
   }
}