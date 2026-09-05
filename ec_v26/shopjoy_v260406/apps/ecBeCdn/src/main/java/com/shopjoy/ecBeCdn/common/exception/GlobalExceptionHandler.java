package com.shopjoy.ecBeCdn.common.exception;

import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/** 전역 예외 → ApiResponse 표준 응답 변환. EcBeBo 의 GlobalExceptionHandler 와 같은 역할. */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CfBizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBiz(CfBizException e) {
        log.warn("[CfBizException] {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
    }

    @ExceptionHandler(CfFileTooLargeException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooLarge(CfFileTooLargeException e) {
        log.warn("[CfFileTooLargeException] {}", e.getMessage());
        return ResponseEntity.status(413).body(ApiResponse.error(413, e.getMessage()));
    }

    /** spring.servlet.multipart.max-file-size 를 넘으면 Spring 이 컨트롤러 진입 전에 이걸 던진다. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMultipartTooLarge(MaxUploadSizeExceededException e) {
        log.warn("[MaxUploadSizeExceededException] {}", e.getMessage());
        return ResponseEntity.status(413).body(ApiResponse.error(413, "업로드 파일 용량이 허용 크기를 초과했습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e) {
        log.error("[Unhandled Exception]", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(500, "서버 오류가 발생했습니다."));
    }
}
