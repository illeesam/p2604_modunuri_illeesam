package com.shopjoy.eccdnapi.auth.dto;

import lombok.Getter;
import lombok.Setter;

/** 부분 수정 — null 인 필드는 그대로 유지(비밀번호는 값이 있을 때만 재해시). */
@Getter
@Setter
public class CfClientUpdateReq {
    private String clientNm;
    private String useYn;
    private String clientPwd;
}
