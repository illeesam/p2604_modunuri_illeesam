package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;

import java.util.Optional;

/* WHERE 없는 전체삭제는 JpaRepository 기본 제공 deleteAllInBatch() 사용 (커스텀 메서드 불필요) */
public interface MbhMemberTokenLogRepository extends JpaRepository<MbhMemberTokenLog, String>, QMbhMemberTokenLogRepository {

    /** 탈퇴 시 보유 토큰 전체 무효화 */
    long deleteByAuthId(String authId);

    /** 로그아웃 시 해당 디바이스(토큰)만 삭제 — 멀티디바이스 세션은 유지 */
    long deleteByAuthIdAndAccessToken(String authId, String accessToken);

    /** (authId, accessToken) 복합 UNIQUE 단건 조회 — 토큰 갱신 시 dirty-checking 저장 필요 */
    Optional<MbhMemberTokenLog> findByAuthIdAndAccessToken(String authId, String accessToken);
}
