package com.shopjoy.ecadminapi.co.auth.data.vo;

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

    /** FO 전용 — 로그인 화면에서 선택한 사이트ID (BO 로그인은 미사용, null 허용) */
    private String siteId;
}
