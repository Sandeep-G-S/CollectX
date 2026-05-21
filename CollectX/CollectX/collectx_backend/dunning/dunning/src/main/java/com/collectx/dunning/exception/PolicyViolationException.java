package com.collectx.dunning.exception;

public class PolicyViolationException extends RuntimeException {
    public PolicyViolationException(String reason) {
        super(reason);
    }
}
