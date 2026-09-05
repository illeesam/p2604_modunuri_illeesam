package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhUserTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;

import java.util.Optional;

/* WHERE 없는 전체삭제는 JpaRepository 기본 제공 deleteAllInBatch() 사용 (커스텀 메서드 불필요) */
public interface SyhUserTokenLogRepository extends JpaRepository<SyhUserTokenLog, String>, QSyhUserTokenLogRepository {

    /** 1세션 정책 — 로그인/로그아웃 시 해당 사용자의 기존 토큰 전체 삭제 */
    long deleteByAuthId(String authId);

    /** (authId, accessToken) 복합 UNIQUE 단건 조회 — 토큰 갱신 시 dirty-checking 저장 필요 */
    Optional<SyhUserTokenLog> findByAuthIdAndAccessToken(String authId, String accessToken);
}
