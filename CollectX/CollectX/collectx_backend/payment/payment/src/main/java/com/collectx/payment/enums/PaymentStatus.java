package com.collectx.payment.enums;

/**
 * Payment state machine:
 *  RECORDED → POSTED → CLOSED
 *  RECORDED → FAILED
 */
public enum PaymentStatus {
    /** Initial state — payment entry lodged by agent, awaiting admin verification */
    RECORDED,
    /** Admin verified; portfolio balance updated */
    POSTED,
    /** Final settled state — all downstream updates complete */
    CLOSED,
    /** Verification failed — bounced cheque, UTR mismatch, etc. */
    FAILED
}
