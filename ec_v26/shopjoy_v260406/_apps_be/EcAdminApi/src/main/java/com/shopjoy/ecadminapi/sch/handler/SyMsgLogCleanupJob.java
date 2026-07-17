package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 발송 로그 자동 정리 배치.
 * batch_code : MSG_LOG_CLEANUP
 * cron       : 0 4 1 * * (매월 1일 04:00)
 *
 * <p>이메일/메시지/시스템알림 발송 이력 테이블에서
 * {@value #KEEP_MONTHS}개월 이상 된 레코드를 삭제한다.
 * FAILED 건도 이 기간을 초과하면 삭제한다 (MsgRetryJob 의 재시도 대상 기간 3일과 분리).</p>
 *
 * <p>삭제 전 건수를 로그로 남겨 운영 감사 기록을 유지한다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyMsgLogCleanupJob implements SchBatchJobHandler {

    /** 이 개월 수 이상 된 발송 로그 삭제 */
    private static final int KEEP_MONTHS = 6;

    private final SyhSendEmailLogRepository emailLogRepository;
    private final SyhSendMsgLogRepository   msgLogRepository;
    private final SyhAlarmSendHistRepository alarmHistRepository;

    @Override
    public String batchCode() { return "MSG_LOG_CLEANUP"; }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(KEEP_MONTHS);
        log.info("[{}] 발송 로그 정리 시작 — 기준: {} 이전 ({}개월 보관)", batchCode(), cutoff, KEEP_MONTHS);

        cleanEmailLog(cutoff);
        cleanMsgLog(cutoff);
        cleanAlarmHist(cutoff);

        log.info("[{}] 발송 로그 정리 완료", batchCode());
    }

    private void cleanEmailLog(LocalDateTime cutoff) {
        long before = emailLogRepository.countOlderThan(cutoff);
        if (before == 0) {
            log.info("[{}] 이메일 로그 — 삭제 대상 없음", batchCode());
            return;
        }
        int deleted = emailLogRepository.deleteOlderThan(cutoff);
        log.info("[{}] 이메일 로그 삭제 — 대상: {}건, 삭제: {}건", batchCode(), before, deleted);
    }

    private void cleanMsgLog(LocalDateTime cutoff) {
        long before = msgLogRepository.countOlderThan(cutoff);
        if (before == 0) {
            log.info("[{}] 메시지 로그 — 삭제 대상 없음", batchCode());
            return;
        }
        int deleted = msgLogRepository.deleteOlderThan(cutoff);
        log.info("[{}] 메시지 로그 삭제 — 대상: {}건, 삭제: {}건", batchCode(), before, deleted);
    }

    private void cleanAlarmHist(LocalDateTime cutoff) {
        long before = alarmHistRepository.countBySendDateBefore(cutoff);
        if (before == 0) {
            log.info("[{}] 시스템알림 이력 — 삭제 대상 없음", batchCode());
            return;
        }
        long deleted = alarmHistRepository.deleteBySendDateBefore(cutoff);
        log.info("[{}] 시스템알림 이력 삭제 — 대상: {}건, 삭제: {}건", batchCode(), before, deleted);
    }
}
