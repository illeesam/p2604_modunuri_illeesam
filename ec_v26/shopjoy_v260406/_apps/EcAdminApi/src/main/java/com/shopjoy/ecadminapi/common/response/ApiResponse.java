package com.shopjoy.ecadminapi.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

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
