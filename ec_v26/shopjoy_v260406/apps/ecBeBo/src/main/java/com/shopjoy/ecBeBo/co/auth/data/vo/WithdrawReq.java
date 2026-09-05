package com.shopjoy.ecadminapi.co.auth.data.vo;

import lombok.Data;

/**
 * 회원 탈퇴 요청 DTO (FO 회원, 소셜/일반 공통).
 *
 * <p>본인 인증은 서버에서 SecurityUtil 로 처리하므로 식별 정보는 받지 않는다.
 * 탈퇴 사유(withdrawReason)만 선택 입력받아 토큰 REVOKE 이력에 남긴다.
 * 소셜 회원은 비밀번호가 없으므로 비밀번호 재확인 필드를 두지 않는다(전부 null 시작).</p>
 */
@Data
public class WithdrawReq {

    /** 탈퇴 사유 (선택). null 가능. */
    private String withdrawReason;
}
