package com.christian4747.pricetracker.exceptions;

/**
 * Thrown when the Product, Price, or Period a request names in its URL doesn't exist. Reported as a 404.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
