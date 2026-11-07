package com.christian4747.pricetracker.exceptions;

/**
 * Thrown when a request clashes with what's already saved, such as a duplicate name or permanently deleting something
 * that isn't deleted. Reported as a 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
