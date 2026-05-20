package nhk.common;

public record ApiResponse<T>(T data, int status, String message) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, 200, "Success");
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(data, 200, message);
    }
}


