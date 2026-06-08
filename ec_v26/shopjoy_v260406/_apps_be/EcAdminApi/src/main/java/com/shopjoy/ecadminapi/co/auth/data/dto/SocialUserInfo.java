package com.shopjoy.ecadminapi.co.auth.data.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 제공자 userinfo 검증 결과 DTO.
 *
 * <p>provider별 userinfo 응답(구글/카카오/네이버)을 정규화하여 한 객체로 표현한다.
 * 회원 매칭/신규가입에서 공통으로 사용한다.</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작.</p>
 * <ul>
 *   <li>snsChannelCd: sy_code codeGrp="SNS_CHANNEL" 코드값 (GOOGLE/KAKAO/NAVER)</li>
 *   <li>snsUserId   : 제공자 플랫폼의 고유 사용자ID (mb_member_sns.sns_user_id 매칭 키)</li>
 *   <li>email/name/phone: 제공자가 내려준 프로필 (동의 범위에 따라 null 가능)</li>
 * </ul>
 */
@Getter
@Builder
public class SocialUserInfo {
    private String snsChannelCd;  // 코드그룹 SNS_CHANNEL 코드값 (GOOGLE/KAKAO/NAVER)
    private String snsUserId;     // 제공자 고유 사용자ID
    private String email;         // 프로필 이메일 (null 가능)
    private String name;          // 프로필 이름 (null 가능)
    private String phone;         // 프로필 연락처 (null 가능)
}
