package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;

public interface MbhMemberTokenLogRepository extends JpaRepository<MbhMemberTokenLog, String>, QMbhMemberTokenLogRepository {
    @Modifying
    @Query("DELETE FROM MbhMemberTokenLog")
    void deleteAllBulk();

    /** 탈퇴 시 보유 토큰 전체 무효화 */
    long deleteByAuthId(String authId);

    /** 로그아웃 시 해당 디바이스(토큰)만 삭제 — 멀티디바이스 세션은 유지 */
    long deleteByAuthIdAndAccessToken(String authId, String accessToken);
}
