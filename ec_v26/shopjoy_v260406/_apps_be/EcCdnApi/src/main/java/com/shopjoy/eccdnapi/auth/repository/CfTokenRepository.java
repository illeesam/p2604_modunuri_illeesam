package com.shopjoy.eccdnapi.auth.repository;

import com.shopjoy.eccdnapi.auth.entity.CfToken;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CfTokenRepository extends JpaRepository<CfToken, String> {

    /** refresh() 조회 키 — 클라이언트는 refreshToken 을 절대 안 갖고 있으므로(서버 보관 원칙),
        매번 "지금 갖고 있는(막 만료됐을 수도 있는) accessToken" 으로 세션 행을 찾는다.
        EcAdminApi 의 BoAuthService.refresh() 가 findByAuthIdAndAccessToken() 을 쓰는 것과 동일 원리. */
    Optional<CfToken> findByAccessToken(String accessToken);

    /** 관리 화면 검색 — clientId 포함(빈 문자열이면 전체). */
    Page<CfToken> findByClientIdContaining(String clientId, Pageable pageable);
}
