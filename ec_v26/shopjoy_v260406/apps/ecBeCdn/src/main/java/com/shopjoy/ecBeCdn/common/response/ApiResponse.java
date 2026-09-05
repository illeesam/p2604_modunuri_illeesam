package com.shopjoy.ecBeCdn.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

/**
 * 표준 API 응답 래퍼 — EcBeBo 의 common.response.ApiResponse 와 같은 형태(ok/status/data/message)
 * 로 통일해서, EcBeBo 쪽에서 두 서버를 호출하는 코드가 같은 파싱 방식을 쓸 수 있게 한다.
 * 다만 EcBeCdn 는 CORS 힌트/디버그 스택 같은 부가 필드가 필요 없어 그 부분만 뺐다.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean ok;
    private final int status;
    private final T data;
    private final String message;

    private ApiResponse(boolean ok, int status, T data, String message) {
        this.ok = ok;
        this.status = status;
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, data, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, 200, data, message);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, data, null);
    }

    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(false, status, null, message);
    }
}
