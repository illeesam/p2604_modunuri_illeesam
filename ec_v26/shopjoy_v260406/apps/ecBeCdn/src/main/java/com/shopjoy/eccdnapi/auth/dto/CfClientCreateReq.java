package com.shopjoy.eccdnapi.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CfClientCreateReq {
    @NotBlank
    private String clientId;
    @NotBlank
    private String clientPwd;
    @NotBlank
    private String clientNm;
}
