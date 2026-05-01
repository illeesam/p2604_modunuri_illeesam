package com.shopjoy.ecadminapi.co.auth.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 비밀번호 변경 요청 DTO (FO/BO 공통)
 * currentPassword / newPassword 모두 SHA-256 해시값으로 전달
 */
@Data
public class ChangePasswordReq {

    @NotBlank(message = "현재 비밀번호를 입력해주세요.")
    private String currentPassword;

    @NotBlank(message = "새 비밀번호를 입력해주세요.")
    private String newPassword;
}
