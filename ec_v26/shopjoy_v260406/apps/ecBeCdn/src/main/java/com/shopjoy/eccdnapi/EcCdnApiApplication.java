package com.shopjoy.eccdnapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * EcCdnApi — 동영상 스트리밍 / 상품이미지 링크 / 파일 업로드 전용 CDN 서버.
 *
 * <p>EcAdminApi 와 완전히 분리된 별도 배포 단위다. 최종 사용자(FO/BO 브라우저)가 이미지·동영상을
 * 직접 GET 으로 요청하는 "정적 서빙" 경로와, EcAdminApi 가 accessToken 으로 인증해 파일을
 * 올리고 지우는 "관리 API" 경로 두 가지를 함께 담당한다.</p>
 *
 * <p>업로드 흐름: 브라우저 → EcAdminApi(멀티파트 수신) → EcCdnApi(accessToken 인증 후 실제 저장).
 * EcCdnApi 는 EcAdminApi 를 향한 CORS/세션 개념이 없다 — 완전히 서버-서버 통신이기 때문.</p>
 *
 * <p>UserDetailsServiceAutoConfiguration 제외: 폼로그인/인메모리 유저 개념이 전혀 없고(JWT
 * Bearer 만 씀) CfTokenAuthFilter 가 인증을 전담하므로, 안 막으면 Spring Boot 가 매 부팅마다
 * "generated security password" 를 만들어 로그에 찍는 무의미한 경고만 남는다.</p>
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class EcCdnApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(EcCdnApiApplication.class, args);
    }
}
