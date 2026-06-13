package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
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
 * SMS(문자) 발송 서비스 (co 레이어).
 *
 * <p>실 통신사 SMS API 가 미연동 상태이므로 실제 발송은 일어나지 않고 <b>발송 시도만</b> 기록한다.
 * 따라서 결과는 항상 {@code FAILED} 로 {@code syh_send_msg_log} (channel_cd=SMS) 에 남는다.
 * 추후 통신사 API 가 연동되면 이 서비스의 발송 로직만 교체하면 된다.</p>
 *
 * <p>발송/이력 저장은 독립 try-catch 로 처리하며, 어떤 경우에도 예외를 위로 던지지 않고
 * {@link SendResultVo} (success=false) 로 반환한다 (호출 흐름 보호).</p>
 *
 * @see CmKakaoSendService 동일 엔티티(syh_send_msg_log)를 쓰는 카카오 채널 (channel_cd=KAKAO)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmSmsSendService {

    private static final String CHANNEL = "SMS";
    private static final String RESULT_FAILED = "FAILED";

    private final SyhSendMsgLogRepository syhSendMsgLogRepository;

    /**
     * SMS 발송 (실 통신사 API 미연동 — 발송 시도만 기록).
     *
     * <p>항상 {@code FAILED} 로 기록하며, {@code syh_send_msg_log} (channel_cd=SMS) 저장 후
     * {@link SendResultVo} (channel=SMS, success=false) 를 반환한다.</p>
     *
     * @param siteId       사이트ID
     * @param recvPhone    수신 전화번호 (없으면 실패 사유에 명시)
     * @param senderPhone  발신 전화번호
     * @param title        제목 (LMS)
     * @param content      발송 내용 (치환 완료본)
     * @param templateId   템플릿ID (sy_template.template_id, 없으면 null)
     * @param templateCode 템플릿코드 스냅샷 (없으면 null)
     * @param refTypeCd    연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)
     * @param refId        연관ID
     * @param params       치환 파라미터 (이력에 JSON 으로 보관)
     * @return 발송 결과 VO (channel=SMS)
     */
    @Transactional
    public SendResultVo sendSms(String siteId, String recvPhone, String senderPhone,
                                String title, String content, String templateId, String templateCode,
                                String refTypeCd, String refId, Map<String, Object> params) {

        // 실 SMS(통신사) API 미연동 → 발송 실패로 기록 (발송 시도만 기록)
        String resultCd = RESULT_FAILED;
        String failReason = "SMS API 미연동 (발송 시도만 기록)";
        if (recvPhone == null || recvPhone.isBlank()) {
            failReason = "수신 전화번호 없음 + SMS API 미연동";
        }
        log.info("[CmSmsSend] SMS 발송 시도 (미연동) → phone={}, refType={}, refId={}",
            recvPhone, refTypeCd, refId);

        String logId = null;
        try {
            SyhSendMsgLog logRow = new SyhSendMsgLog();
            logId = CmUtil.generateId("syh_send_msg_log");
            logRow.setLogId(logId);
            logRow.setSiteId(siteId);
            logRow.setChannelCd(CHANNEL);
            logRow.setTemplateId(templateId);
            logRow.setTemplateCode(templateCode);
            logRow.setRecvPhone(recvPhone);
            logRow.setSenderPhone(senderPhone);
            logRow.setTitle(title);
            logRow.setContent(content);
            logRow.setParams(CmUtil.toJsonParams(params));
            logRow.setResultCd(resultCd);
            logRow.setResultMsg("미연동");
            logRow.setFailReason(failReason);
            logRow.setSendDate(LocalDateTime.now());
            logRow.setRefTypeCd(refTypeCd);
            logRow.setRefId(refId);
            stampReg(logRow);
            syhSendMsgLogRepository.save(logRow);
        } catch (Exception e) {
            logId = null;
            log.error("[CmSmsSend] SMS 발송 이력 저장 실패 (refId={})", refId, e);
        }

        return SendResultVo.builder()
            .channel(CHANNEL)
            .success(false)
            .resultCd(resultCd)
            .logId(logId)
            .failReason(failReason)
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

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
