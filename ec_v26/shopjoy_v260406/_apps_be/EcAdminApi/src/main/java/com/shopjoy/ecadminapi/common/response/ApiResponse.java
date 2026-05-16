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

    /** 성공 여부. 성공 응답이면 true, 모든 오류 응답이면 false. */
    private final boolean ok;

    /** HTTP 상태코드와 동일한 값 (200/201/400/401/403/404/500 등). */
    private final int status;

    /** 본문 데이터. 성공 시 페이로드, 오류 시 보통 null (필드 오류 맵 등은 예외). */
    private final T data;

    /** 안내/오류 메시지. 성공 시 보통 null, 오류 시 사용자 노출 문구. */
    private final String message;

    /** 오류 발생 소스 스택 추적 (오류 시에만 포함) */
    private String descErrStack;

    /** 오류 발생 시점 사용자·요청 정보 (오류 시에만 포함) */
    private String descErrUserInfo;

    /**
     * 전 필드를 받는 private 생성자. 외부 생성은 정적 팩토리 메서드로만 허용한다.
     *
     * @param ok      성공 여부
     * @param status  HTTP 상태코드
     * @param data    본문 데이터 (nullable)
     * @param message 안내/오류 메시지 (nullable)
     */
    private ApiResponse(boolean ok, int status, T data, String message) {
        this.ok = ok;
        this.status = status;
        this.data = data;
        this.message = message;
    }

    /**
     * 200 성공 응답을 생성한다(데이터만).
     *
     * @param data 응답 페이로드 (null 이면 JSON 에서 생략됨)
     * @param <T>  페이로드 타입
     * @return ok=true, status=200 인 응답
     */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, data, null);
    }

    /**
     * 200 성공 응답을 생성한다(데이터 + 안내 메시지).
     *
     * @param data    응답 페이로드
     * @param message 안내 문구 (예: "삭제되었습니다.")
     * @param <T>     페이로드 타입
     * @return ok=true, status=200 인 응답
     */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, 200, data, message);
    }

    /**
     * 201 Created 등록 성공 응답을 생성한다.
     *
     * @param data 생성된 리소스 페이로드
     * @param <T>  페이로드 타입
     * @return ok=true, status=201 인 응답
     */
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, data, null);
    }

    /**
     * 오류 응답을 생성한다(데이터 없음).
     *
     * <p>주로 {@link com.shopjoy.ecadminapi.common.exception.GlobalExceptionHandler}
     * 에서 사용한다. 제네릭 추론이 안 되는 호출부에서는 {@code ApiResponse.<Void>error(...)}
     * 처럼 타입을 명시한다.</p>
     *
     * @param status  HTTP 상태코드
     * @param message 오류 메시지
     * @param <T>     페이로드 타입(데이터 없으므로 보통 Void)
     * @return ok=false, data=null 인 오류 응답
     */
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(false, status, null, message);
    }

    /**
     * 오류 응답을 생성한다(필드별 오류 상세 등을 data 에 포함).
     *
     * <p>예: 검증 실패 시 {@code {필드: 메시지}} 맵을 data 에 실어 반환.</p>
     *
     * @param status  HTTP 상태코드
     * @param message 통합 오류 메시지
     * @param data    오류 상세 페이로드(필드 오류 맵 등)
     * @param <T>     페이로드 타입
     * @return ok=false 인 오류 응답
     */
    public static <T> ApiResponse<T> error(int status, String message, T data) {
        return new ApiResponse<>(false, status, data, message);
    }

    /**
     * 디버그 정보(스택·사용자정보)를 현재 응답에 채워 자기 자신을 반환한다.
     *
     * <p>{@link com.shopjoy.ecadminapi.common.exception.GlobalExceptionHandler}
     * 가 오류 응답 생성 직후 체이닝으로 호출한다. 두 값 모두 {@code @JsonInclude(NON_NULL)}
     * 이므로 null 이면 JSON 에서 생략된다.</p>
     *
     * @param stack    필터링된 스택 추적 문자열 ({@code descErrStack})
     * @param userInfo 사용자·요청 정보 문자열 ({@code descErrUserInfo})
     * @return 디버그 필드가 채워진 자기 자신 (체이닝용)
     */
    public ApiResponse<T> withDebug(String stack, String userInfo) {
        this.descErrStack    = stack;
        this.descErrUserInfo = userInfo;
        return this;
    }
}
