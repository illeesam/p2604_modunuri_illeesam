package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 회원 비밀번호 변경 Request DTO.
 * 사용: PUT /api/fo/my/page/password
 */
public class MbMemberChangePasswordDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 200) private String currentPassword;
        @Size(max = 200) private String newPassword;
    }
}
