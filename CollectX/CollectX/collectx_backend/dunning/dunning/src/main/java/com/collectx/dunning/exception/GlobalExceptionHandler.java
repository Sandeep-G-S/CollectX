package com.collectx.dunning.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleAccessDenied(AccessDeniedException ex) {
        return error(403, "Access Denied", "You do not have permission to perform this action");
    }

    /** 404 — loan / policy / consent record not found */
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(NotFoundException ex) {
        return error(404, "Not Found", ex.getMessage());
    }

    /** 422 — policy rule violated (DoNotCall, MaxAttempts, MinGap, ConsentOptOut) */
    @ExceptionHandler(PolicyViolationException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public Map<String, Object> handlePolicyViolation(PolicyViolationException ex) {
        return error(422, "Policy Violation", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleIllegalArg(IllegalArgumentException ex) {
        return error(400, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleRuntime(RuntimeException ex) {
        return error(400, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneral(Exception ex) {
        return error(500, "Internal Server Error", ex.getMessage());
    }

    private Map<String, Object> error(int status, String error, String message) {
        return Map.of(
                "status",    status,
                "error",     error,
                "message",   message,
                "timestamp", LocalDateTime.now().toString()
        );
    }
}
