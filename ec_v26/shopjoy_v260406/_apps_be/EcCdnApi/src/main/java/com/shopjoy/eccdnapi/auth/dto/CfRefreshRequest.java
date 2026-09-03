package com.shopjoy.eccdnapi.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CfRefreshRequest {
    @NotBlank
    private String refreshToken;
}
