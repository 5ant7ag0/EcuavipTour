package com.ecuaviptour.exception;

public abstract class EcuavipException extends RuntimeException {
    public EcuavipException(String message) {
        super(message);
    }

    public EcuavipException(String message, Throwable cause) {
        super(message, cause);
    }
}
