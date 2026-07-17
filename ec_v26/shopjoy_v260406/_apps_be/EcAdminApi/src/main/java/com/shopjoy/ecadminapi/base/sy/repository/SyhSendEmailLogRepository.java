package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SyhSendEmailLogRepository extends JpaRepository<SyhSendEmailLog, String>, QSyhSendEmailLogRepository {

    /** 재발송 대상: FAILED 이고 send_date 가 threshold 이전인 건 (최대 maxRetry 회 미만) */
    @Query("SELECT e FROM SyhSendEmailLog e WHERE e.resultCd = 'FAILED' AND e.sendDate < :threshold")
    List<SyhSendEmailLog> findFailedBefore(@Param("threshold") LocalDateTime threshold);

    /** 오래된 로그 삭제: send_date 가 before 이전인 전체 건 */
    @Modifying
    @Query("DELETE FROM SyhSendEmailLog e WHERE e.sendDate < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);

    /** 기간 내 건수 — 정리 전 로깅용 */
    @Query("SELECT COUNT(e) FROM SyhSendEmailLog e WHERE e.sendDate < :before")
    long countOlderThan(@Param("before") LocalDateTime before);
}
