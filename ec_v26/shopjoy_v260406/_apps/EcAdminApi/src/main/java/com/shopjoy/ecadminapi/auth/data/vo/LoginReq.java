package com.shopjoy.ecadminapi.auth.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 로그인 요청 DTO (FO/BO 공통)
 */
@Data
public class LoginReq {

    @NotBlank(message = "로그인 ID를 입력해주세요.")
    private String loginId;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String loginPwd;
}
