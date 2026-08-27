package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendMsgLogRepository;

import java.time.LocalDateTime;

/* findFailedBefore → QSyhSendMsgLogRepository.selectFailedBefore 로 전환 (2026-08-27) */
public interface SyhSendMsgLogRepository extends JpaRepository<SyhSendMsgLog, String>, QSyhSendMsgLogRepository {

    /** 오래된 로그 삭제: send_date 가 before 이전인 전체 건 */
    @Modifying
    @Query("DELETE FROM SyhSendMsgLog m WHERE m.sendDate < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);

    /** 기간 내 건수 — 정리 전 로깅용 */
    @Query("SELECT COUNT(m) FROM SyhSendMsgLog m WHERE m.sendDate < :before")
    long countOlderThan(@Param("before") LocalDateTime before);
}
