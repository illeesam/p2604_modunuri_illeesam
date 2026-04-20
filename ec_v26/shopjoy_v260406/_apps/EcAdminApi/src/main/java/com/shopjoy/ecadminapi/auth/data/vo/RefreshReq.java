package com.shopjoy.ecadminapi.auth.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshReq {
    @NotBlank(message = "refreshToken을 입력해주세요.")
    private String refreshToken;
}
