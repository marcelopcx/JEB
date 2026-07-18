package com.ziff.jeb.exception;

import jakarta.ejb.ApplicationException;

@ApplicationException(rollback = true)
public class InvalidCartRequestException extends RuntimeException {

    public InvalidCartRequestException(String message) {
        super(message);
    }
}
