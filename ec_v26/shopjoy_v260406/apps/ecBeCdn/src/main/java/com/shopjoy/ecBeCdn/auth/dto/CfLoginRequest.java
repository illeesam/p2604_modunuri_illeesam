package com.shopjoy.ecBeCdn.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CfLoginRequest {
    @NotBlank
    private String id;
    @NotBlank
    private String pwd;
}
