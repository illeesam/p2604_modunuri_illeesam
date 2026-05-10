package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 앱 정보 VO
 * - BO/FO 통합 (사이트 번호는 bo/foSiteNo 중 사용 가능)
 * - 외부 SDK / 서비스 연동 키 모음 (현재는 모두 더미값)
 *   ※ 실제 운영 시: sy_prop 테이블에서 siteId 기준 조회로 전환 예정
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreApp {
    private String boSiteNo;          // BO 사이트 번호
    private String foSiteNo;          // FO 사이트 번호
    private String appVersion;        // 앱 버전
    private String lastUpdateDate;    // 마지막 업데이트 날짜
    private String active;            // 환경 (local, dev, prod)

    // ── 소셜 로그인 SDK 키 ──
    private String googleClientId;        // Google OAuth Client ID
    private String kakaoJsKey;            // Kakao JavaScript App Key
    private String naverClientId;         // Naver Login Client ID
    private String naverCallbackUrl;      // Naver Login 콜백 URL
    private String facebookAppId;         // Facebook Login App ID
    private String appleClientId;         // Apple Sign-In Service ID

    // ── 결제 SDK 키 ──
    private String tossClientKey;         // Toss Payments Client Key
    private String kakaoPayCid;           // Kakao Pay CID (가맹점 코드)
    private String naverPayClientId;      // Naver Pay Client ID
    private String inicisMid;             // KG이니시스 MID
    private String kcpSiteCd;             // KCP Site Code

    // ── 지도 SDK 키 ──
    private String naverMapClientId;      // Naver Cloud Map Client ID
    private String kakaoMapJsKey;         // Kakao Map JavaScript Key
    private String googleMapApiKey;       // Google Maps JavaScript API Key

    // ── AWS ──
    private String awsRegion;             // AWS Region (예: ap-northeast-2)
    private String awsS3Bucket;           // S3 Bucket 이름 (업로드용)
    private String awsS3PublicUrl;        // S3 Public Base URL (CloudFront 도메인 권장)
    private String awsCognitoIdentityPoolId; // Cognito Identity Pool ID (브라우저 직접 업로드 시)

    // ── 알림 / 메시징 ──
    private String kakaoAlimtalkSenderKey; // Kakao 알림톡 발신프로필 키
    private String nhnCloudSmsAppKey;      // NHN Cloud SMS App Key
    private String ncloudSensServiceId;    // Naver Cloud SENS Service ID

    // ── 본인인증 ──
    private String niceClientId;          // NICE 본인인증 Client ID
    private String passClientId;          // PASS 인증 Client ID

    // ── 보안 / 분석 ──
    private String recaptchaSiteKey;      // Google reCAPTCHA v3 Site Key
    private String gaTrackingId;          // Google Analytics 측정 ID (G-XXXX)
    private String naverAnalyticsId;      // Naver Analytics ID
    private String facebookPixelId;       // Facebook Pixel ID

    // ── 채팅 / CS ──
    private String channelTalkPluginKey;  // 채널톡 Plugin Key

    // ── 기타 ──
    private String daumPostcodeUrl;       // Daum 우편번호 스크립트 URL (커스텀 시)
}
