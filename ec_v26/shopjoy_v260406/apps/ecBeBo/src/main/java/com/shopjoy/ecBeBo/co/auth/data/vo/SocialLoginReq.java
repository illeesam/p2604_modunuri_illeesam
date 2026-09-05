package com.shopjoy.ecadminapi.co.auth.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 소셜 로그인 요청 DTO (FO/BO 공통)
 *
 * <p>흐름: 클라이언트(브라우저/앱)가 각 소셜 제공자 SDK로 로그인하여 받은 accessToken을
 * 그대로 서버에 전달한다. 서버는 provider별 userinfo 엔드포인트로 accessToken을 검증해
 * 실제 SNS 사용자ID/프로필을 확보한 뒤 회원 매칭/신규가입을 처리한다.</p>
 *
 * <p>주의(필드 default 금지 정책): 모든 필드는 null 시작. 프로필 값(email/name/phone)은
 * 서버가 userinfo 검증으로 직접 채우는 것을 원칙으로 하되, 클라이언트가 보조로 전달할 수
 * 있어 신규가입 시 fallback으로만 사용한다(검증된 값이 우선).</p>
 */
@Data
public class SocialLoginReq {

    /** 소셜 제공자: google / kakao / naver (대소문자 무시) */
    @NotBlank(message = "소셜 제공자(provider)를 입력해주세요.")
    private String provider;

    /** 클라이언트가 제공자 SDK로 발급받은 accessToken (서버에서 userinfo로 검증) */
    @NotBlank(message = "소셜 accessToken을 입력해주세요.")
    private String accessToken;

    /** 사이트ID. 멀티사이트 매칭/신규가입 대상 사이트. 미전달 시 서버 기본 사이트 사용 */
    private String siteId;

    /** (보조) 클라이언트가 전달하는 이메일. 신규가입 시 검증값이 없을 때 fallback */
    private String email;

    /** (보조) 클라이언트가 전달하는 이름. 신규가입 시 검증값이 없을 때 fallback */
    private String name;

    /** (보조) 클라이언트가 전달하는 연락처. 신규가입 시 검증값이 없을 때 fallback */
    private String phone;
}
