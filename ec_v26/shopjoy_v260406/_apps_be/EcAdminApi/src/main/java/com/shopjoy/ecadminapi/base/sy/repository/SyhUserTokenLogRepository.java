package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;

public interface SyhUserTokenLogRepository extends JpaRepository<SyhUserTokenLog, String>, QSyhUserTokenLogRepository {
    @Modifying
    @Query("DELETE FROM SyhUserTokenLog")
    void deleteAllBulk();

    /** 1세션 정책 — 로그인/로그아웃 시 해당 사용자의 기존 토큰 전체 삭제 */
    long deleteByAuthId(String authId);
}
