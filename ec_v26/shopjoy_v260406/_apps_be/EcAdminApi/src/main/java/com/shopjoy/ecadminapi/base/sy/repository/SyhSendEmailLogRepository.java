package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SyhSendEmailLogRepository extends JpaRepository<SyhSendEmailLog, String>, QSyhSendEmailLogRepository {

    /** 재발송 대상 — FAILED 이고 sendDate 가 threshold 이전 */
    List<SyhSendEmailLog> findByResultCdAndSendDateBefore(String resultCd, LocalDateTime threshold);

    /** 기간 내 건수 — 정리 전 로깅용 */
    long countBySendDateBefore(LocalDateTime before);

    /** 오래된 로그 삭제: sendDate 가 before 이전인 전체 건 (SyhAlarmSendHistRepository 와 동일 패턴) */
    long deleteBySendDateBefore(LocalDateTime before);
}
