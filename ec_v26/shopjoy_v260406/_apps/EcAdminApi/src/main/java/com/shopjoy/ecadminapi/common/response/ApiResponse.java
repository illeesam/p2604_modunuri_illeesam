package com.shopjoy.ecadminapi.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

/**
 * 모든 API의 표준 응답 래퍼.
 *
 * 응답 형태:
 * { "ok": true,  "status": 200, "data": { ... } }
 * { "ok": false, "status": 400, "message": "오류 메시지",
 *   "descErrStack": "...", "descErrUserInfo": "userId=... | ..." }
 *
 * null 필드는 JSON에서 생략된다 (@JsonInclude NON_NULL).
 * 정적 팩토리 메서드로만 생성하고, debug 필드는 withDebug()로 체이닝한다.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean ok;
    private final int status;
    private final T data;
    private final String message;

    /** 오류 발생 소스 스택 추적 (오류 시에만 포함) */
    private String descErrStack;

    /** 오류 발생 시점 사용자·요청 정보 (오류 시에만 포함) */
    private String descErrUserInfo;

    private ApiResponse(boolean ok, int status, T data, String message) {
        this.ok = ok;
        this.status = status;
        this.data = data;
        this.message = message;
    }

    /** 200 성공 — 데이터만 반환 */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, data, null);
    }

    /** 200 성공 — 데이터 + 안내 메시지 (예: "삭제되었습니다.") */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, 200, data, message);
    }

    /** 201 Created — 등록 성공 */
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, data, null);
    }

    /** 오류 응답 */
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(false, status, null, message);
    }

    /** 오류 응답 — 필드별 오류 상세(errors 등)를 data에 포함할 때 사용 */
    public static <T> ApiResponse<T> error(int status, String message, T data) {
        return new ApiResponse<>(false, status, data, message);
    }

    /** 디버그 정보 체이닝 — GlobalExceptionHandler에서 오류 응답에 추가 */
    public ApiResponse<T> withDebug(String stack, String userInfo) {
        this.descErrStack    = stack;
        this.descErrUserInfo = userInfo;
        return this;
    }
}
