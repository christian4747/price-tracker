package com.christian4747.pricetracker.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@RestControllerAdvice
@EnableWebMvc
public class GlobalExceptionHandler {

    /**
     * Handles any globally thrown IllegalArgumentException.
     * @param ex The thrown IllegalArgumentException
     * @return A 400 response with a description of what caused the exception
     */
    @ExceptionHandler(value = {IllegalArgumentException.class})
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(400).body(ex.getMessage());
    }

}