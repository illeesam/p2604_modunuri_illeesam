package com.shopjoy.ecadminapi.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshRequest {
    @NotBlank(message = "refreshToken을 입력해주세요.")
    private String refreshToken;
}
