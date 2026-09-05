package com.shopjoy.eccdnapi.common.exception;

/** 업무 예외 — 클라이언트에 그대로 노출해도 되는 메시지만 담는다(400 Bad Request). */
public class CfBizException extends RuntimeException {
    public CfBizException(String message) {
        super(message);
    }
}
