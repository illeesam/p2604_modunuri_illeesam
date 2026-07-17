package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMailSendService;
import com.shopjoy.ecadminapi.co.cm.service.CmKakaoSendService;
import com.shopjoy.ecadminapi.co.cm.service.CmSmsSendService;
import com.shopjoy.ecadminapi.co.cm.service.CmAlarmSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 발송 실패 메시지 자동 재발송 배치.
 * batch_code : MSG_RETRY
 * cron       : 0 *\/2 * * * (2시간마다)
 *
 * <p>최근 {@value #RETRY_WINDOW_HOURS}시간 이전에 실패한 이메일/SMS/카카오/시스템알림을
 * 채널 서비스를 통해 재발송하고 로그 레코드를 갱신한다. 재발송 성공/실패 여부와 관계없이
 * {@value #MAX_RETRY_AGE_DAYS}일 이상 된 FAILED 건은 재시도 없이 그대로 둔다(정리는 MsgLogCleanupJob).</p>
 *
 * <p>채널 서비스(CmMailSendService 등)는 재발송 시 새 로그 레코드를 INSERT 하므로, 이 Job 에서는
 * 원본 로그의 result_cd 를 'RETRIED' 로 마킹하여 중복 재시도를 방지한다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyMsgRetryJob implements SchBatchJobHandler {

    /** 이 시간(시) 이내 실패건은 아직 담당자가 직접 처리 중일 수 있으므로 건너뜀 */
    private static final int RETRY_SKIP_RECENT_HOURS = 1;

    /** 이 일수 이상 된 실패건은 재시도 대상 제외 (너무 오래된 건은 수동 처리) */
    private static final int MAX_RETRY_AGE_DAYS = 3;

    private final SyhSendEmailLogRepository emailLogRepository;
    private final SyhSendMsgLogRepository   msgLogRepository;
    private final CmMailSendService         cmMailSendService;
    private final CmKakaoSendService        cmKakaoSendService;
    private final CmSmsSendService          cmSmsSendService;
    private final CmAlarmSendService        cmAlarmSendService;

    @Override
    public String batchCode() { return "MSG_RETRY"; }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 발송 실패 재시도 시작", batchCode());

        int emailRetried = retryEmails(now);
        int msgRetried   = retryMsgs(now);

        log.info("[{}] 완료 — 이메일 재발송: {}건, 메시지(SMS/카카오) 재발송: {}건",
            batchCode(), emailRetried, msgRetried);
    }

    /* ── 이메일 재발송 ────────────────────────────────────────────── */

    private int retryEmails(LocalDateTime now) {
        // 1시간 이전 ~ 3일 이전 FAILED 건만 재시도
        LocalDateTime from = now.minusDays(MAX_RETRY_AGE_DAYS);
        LocalDateTime to   = now.minusHours(RETRY_SKIP_RECENT_HOURS);

        List<SyhSendEmailLog> targets = emailLogRepository.findFailedBefore(to).stream()
            .filter(e -> e.getSendDate() != null && e.getSendDate().isAfter(from))
            .toList();

        int success = 0, fail = 0;
        for (SyhSendEmailLog log0 : targets) {
            try {
                SendResultVo result = cmMailSendService.sendMail(
                    log0.getSiteId(), log0.getToAddr(), log0.getSubject(), log0.getContent(),
                    log0.getTemplateId(), log0.getTemplateCode(),
                    log0.getRefTypeCd(), log0.getRefId(), Map.of());

                // 원본 레코드 RETRIED 마킹 — 중복 재시도 방지
                log0.setResultCd("RETRIED");
                log0.setFailReason("[BATCH] 재발송 " + (Boolean.TRUE.equals(result.getSuccess()) ? "성공" : "실패") + " (" + now + ")");
                log0.setUpdBy("BATCH");
                log0.setUpdDate(now);
                emailLogRepository.save(log0);

                if (Boolean.TRUE.equals(result.getSuccess())) success++; else fail++;
                log.info("[{}] 이메일 재발송 {} → to={} logId={}",
                    batchCode(), Boolean.TRUE.equals(result.getSuccess()) ? "성공" : "실패",
                    log0.getToAddr(), log0.getLogId());
            } catch (Exception e) {
                fail++;
                log.warn("[{}] 이메일 재발송 예외 logId={}: {}", batchCode(), log0.getLogId(), e.getMessage());
            }
        }
        log.info("[{}] 이메일 재발송 완료 — 대상: {}건, 성공: {}건, 실패: {}건",
            batchCode(), targets.size(), success, fail);
        return targets.size();
    }

    /* ── SMS/카카오 재발송 ────────────────────────────────────────── */

    private int retryMsgs(LocalDateTime now) {
        LocalDateTime from = now.minusDays(MAX_RETRY_AGE_DAYS);
        LocalDateTime to   = now.minusHours(RETRY_SKIP_RECENT_HOURS);

        List<SyhSendMsgLog> targets = msgLogRepository.findFailedBefore(to).stream()
            .filter(m -> m.getSendDate() != null && m.getSendDate().isAfter(from))
            .toList();

        int success = 0, fail = 0;
        for (SyhSendMsgLog msg : targets) {
            try {
                SendResultVo result = switch (nz(msg.getChannelCd())) {
                    case "KAKAO" -> cmKakaoSendService.sendKakao(
                        msg.getSiteId(), msg.getRecvPhone(), msg.getContent(),
                        msg.getKakaoTplCode(), msg.getTemplateId(), msg.getTemplateCode(),
                        msg.getRefTypeCd(), msg.getRefId(), Map.of());
                    case "SMS", "LMS" -> cmSmsSendService.sendSms(
                        msg.getSiteId(), msg.getRecvPhone(), msg.getSenderPhone(), msg.getTitle(),
                        msg.getContent(), msg.getTemplateId(), msg.getTemplateCode(),
                        msg.getRefTypeCd(), msg.getRefId(), Map.of());
                    default -> {
                        log.warn("[{}] 재발송 미지원 채널: {} logId={}", batchCode(), msg.getChannelCd(), msg.getLogId());
                        yield SendResultVo.builder().channel(msg.getChannelCd()).success(false)
                            .resultCd("SKIPPED").failReason("미지원 채널").build();
                    }
                };

                msg.setResultCd("RETRIED");
                msg.setFailReason("[BATCH] 재발송 " + (Boolean.TRUE.equals(result.getSuccess()) ? "성공" : "실패") + " (" + now + ")");
                msg.setUpdBy("BATCH");
                msg.setUpdDate(now);
                msgLogRepository.save(msg);

                if (Boolean.TRUE.equals(result.getSuccess())) success++; else fail++;
                log.info("[{}] 메시지({}) 재발송 {} → to={} logId={}",
                    batchCode(), msg.getChannelCd(), Boolean.TRUE.equals(result.getSuccess()) ? "성공" : "실패",
                    msg.getRecvPhone(), msg.getLogId());
            } catch (Exception e) {
                fail++;
                log.warn("[{}] 메시지 재발송 예외 logId={}: {}", batchCode(), msg.getLogId(), e.getMessage());
            }
        }
        log.info("[{}] 메시지 재발송 완료 — 대상: {}건, 성공: {}건, 실패: {}건",
            batchCode(), targets.size(), success, fail);
        return targets.size();
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
