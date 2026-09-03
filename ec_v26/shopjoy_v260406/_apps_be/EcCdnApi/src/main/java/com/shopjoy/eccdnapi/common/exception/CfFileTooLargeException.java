package com.shopjoy.eccdnapi.common.exception;

/**
 * 업로드 파일이 허용 용량(app.cf.max-file-size-mb, 기본 120MB)을 초과했을 때 던지는 전용 예외.
 * spring.servlet.multipart.max-file-size 가 같은 값으로 걸려있어 대부분은 Spring 이 먼저
 * MaxUploadSizeExceededException 으로 막지만(GlobalExceptionHandler 에서 같이 처리),
 * CfFileService 에서도 한 번 더 명시적으로 검증해 "용량 초과" 임을 명확한 메시지로 알려준다.
 */
public class CfFileTooLargeException extends RuntimeException {
    public CfFileTooLargeException(String message) {
        super(message);
    }
}
