package com.shopjoy.ecadminapi.auth.data.vo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FoLoginReq {
    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String memberEmail;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String memberPassword;
}
