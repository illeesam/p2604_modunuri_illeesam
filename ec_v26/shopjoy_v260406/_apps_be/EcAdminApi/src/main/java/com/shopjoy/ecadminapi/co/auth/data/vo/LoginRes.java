package com.shopjoy.ecadminapi.co.auth.data.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginRes {
    private String accessToken;
    private String refreshToken;
    private String authId;          // 인증 식별자: BO=sy_user.user_id, FO=ec_member.member_id
    private String userId;          // BO 전용: sy_user.user_id
    private String memberId;        // FO 전용: ec_member.member_id
    private String userNm;          // 사용자명 (sy_user.user_nm 또는 ec_member.member_nm)
    private String userEmail;
    private String userPhone;
    private String deptNm;
    private String siteId;
    private String roleId;
    private String deptId;
    private String appTypeCd;
    private String vendorId;
    private String profileAttachId;
}
