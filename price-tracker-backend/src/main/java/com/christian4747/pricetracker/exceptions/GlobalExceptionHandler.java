package com.christian4747.pricetracker.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns exceptions into error responses. Each response is a ProblemDetail (RFC 9457) with the exception's message in
 * 'detail'. Spring's own errors, such as a request method that isn't supported, are handled by
 * ResponseEntityExceptionHandler in the same format. They're in this class, rather than a separate one, so the
 * catch-all for unexpected exceptions doesn't take them over: within one class, the most specific handler wins.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles any globally thrown IllegalArgumentException.
     * @param ex The thrown IllegalArgumentException
     * @return A 400 response with a description of what caused the exception
     */
    @ExceptionHandler(value = {IllegalArgumentException.class})
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handles any globally thrown NotFoundException.
     * @param ex The thrown NotFoundException
     * @return A 404 response with a description of what wasn't found
     */
    @ExceptionHandler(value = {NotFoundException.class})
    public ProblemDetail handleNotFound(NotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Handles any globally thrown ConflictException.
     * @param ex The thrown ConflictException
     * @return A 409 response with a description of the conflict
     */
    @ExceptionHandler(value = {ConflictException.class})
    public ProblemDetail handleConflict(ConflictException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    /**
     * Handles any exception nothing else handles. The exception is logged, but its message isn't sent, since it can
     * hold internal details such as SQL.
     * @param ex The thrown exception
     * @return A 500 response with a generic message
     */
    @ExceptionHandler(value = {Exception.class})
    public ProblemDetail handleUnexpected(Exception ex) {
        logger.error("Unexpected error while handling a request", ex);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on the server.");
    }

}
