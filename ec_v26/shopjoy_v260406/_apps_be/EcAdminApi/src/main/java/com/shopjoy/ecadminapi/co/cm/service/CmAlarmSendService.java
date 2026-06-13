package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 시스템 알림 발송 서비스 (sy_alarm 1건 생성 + syh_alarm_send_hist 기록).
 *
 * <p>채널 단일 책임 분리: 시스템 알림 채널만 담당한다.
 * 발송(=알림 생성) 시도 → 결과코드 결정(SUCCESS/FAILED) → 이력 저장 → {@link SendResultVo} 반환.
 * sy_alarm 의 alarm_id 가 NOT NULL 이므로 알림 생성 실패 시 이력은 생략하고 실패 VO 를 반환한다.
 * 실패해도 예외를 위로 던지지 않고 {@code success=false} VO 로 반환한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmAlarmSendService {

    private static final String CHANNEL_SYSTEM   = "SYSTEM";
    private static final String RESULT_SUCCESS   = "SUCCESS";
    private static final String RESULT_FAILED    = "FAILED";
    private static final String HIST_SENT        = "SENT";
    private static final String DEFAULT_TYPE_CD  = "CONTACT";

    private final SyAlarmRepository          syAlarmRepository;
    private final SyhAlarmSendHistRepository syhAlarmSendHistRepository;

    /**
     * 시스템 알림 1건을 생성하고 발송 이력을 기록한다.
     *
     * @param siteId      사이트ID
     * @param alarmTitle  알림제목 (sy_alarm.alarm_title — NOT NULL)
     * @param alarmMsg    발송내용
     * @param alarmTypeCd 알림유형 (null 이면 "CONTACT")
     * @param memberId    수신자 회원ID (이력에 기록)
     * @param sendTo      수신처 (이메일/전화/토큰 — 이력에 기록)
     * @param templateId  템플릿ID (선택)
     * @param refId       참조ID (현재 미저장 — 시그니처 호환용)
     * @param params      파라미터 (현재 미저장 — 시그니처 호환용)
     * @return 발송 결과 VO (실패해도 예외 없이 success=false 반환)
     */
    @Transactional
    public SendResultVo sendSystemAlarm(String siteId, String alarmTitle, String alarmMsg,
                                        String alarmTypeCd, String memberId, String sendTo,
                                        String templateId, String refId, Map<String, Object> params) {
        String title = nz(alarmTitle).isBlank() ? "신규 알림" : alarmTitle;
        String typeCd = (alarmTypeCd == null || alarmTypeCd.isBlank()) ? DEFAULT_TYPE_CD : alarmTypeCd;

        // 1) sy_alarm 1건 생성 (실패 시 이력 생략 + 실패 VO 반환)
        String alarmId;
        try {
            SyAlarm alarm = new SyAlarm();
            alarmId = CmUtil.generateId("sy_alarm");
            alarm.setAlarmId(alarmId);
            alarm.setSiteId(siteId);
            alarm.setAlarmTitle(title);
            alarm.setAlarmTypeCd(typeCd);
            alarm.setChannelCd(CHANNEL_SYSTEM);
            alarm.setTargetTypeCd("ADMIN");
            alarm.setTargetId(memberId);
            alarm.setTemplateId(templateId);
            alarm.setAlarmMsg(alarmMsg);
            alarm.setAlarmSendDate(LocalDateTime.now());
            alarm.setAlarmStatusCd(HIST_SENT);
            alarm.setAlarmSendCount(1);
            alarm.setAlarmFailCount(0);
            stampReg(alarm);
            syAlarmRepository.save(alarm);
            log.info("[CmAlarmSend] 시스템 알림 생성 (alarmId={}, refId={})", alarmId, refId);
        } catch (Exception e) {
            log.error("[CmAlarmSend] 시스템 알림(sy_alarm) 저장 실패 (refId={})", refId, e);
            // alarm_id 가 NOT NULL 이므로 알림 생성 실패 시 이력 생략
            return SendResultVo.builder()
                .channel(CHANNEL_SYSTEM)
                .success(false)
                .resultCd(RESULT_FAILED)
                .failReason(CmUtil.describeError(e, 500))
                .build();
        }

        // 2) syh_alarm_send_hist 1건 기록 (이력 저장 실패는 log.error 만)
        String sendHistId = null;
        try {
            SyhAlarmSendHist hist = new SyhAlarmSendHist();
            sendHistId = CmUtil.generateId("syh_alarm_send_hist");
            hist.setSendHistId(sendHistId);
            hist.setSiteId(siteId);
            hist.setAlarmId(alarmId);
            hist.setMemberId(memberId);
            hist.setChannel(CHANNEL_SYSTEM);
            hist.setSendTo(sendTo);
            hist.setSendDate(LocalDateTime.now());
            hist.setSendHistStatusCd(HIST_SENT);
            stampReg(hist);
            syhAlarmSendHistRepository.save(hist);
        } catch (Exception e) {
            log.error("[CmAlarmSend] 알림 발송 이력 저장 실패 (alarmId={})", alarmId, e);
        }

        return SendResultVo.builder()
            .channel(CHANNEL_SYSTEM)
            .success(true)
            .resultCd(RESULT_SUCCESS)
            .logId(sendHistId)
            .build();
    }

    /* ─────────────────────────────────────────────────────────────
     * 내부 헬퍼
     * ───────────────────────────────────────────────────────────── */

    /** reg/upd 감사 필드 수동 주입 (리스너 비활성 케이스 안전망, 비회원=GUEST). */
    private void stampReg(BaseEntity e) {
        String authId = SecurityUtil.getAuthIdOrGuest();
        LocalDateTime now = LocalDateTime.now();
        e.setRegBy(authId);
        e.setRegDate(now);
        e.setUpdBy(authId);
        e.setUpdDate(now);
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
