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
 * 카카오 알림톡 발송 서비스 (co 레이어, 단일 채널 책임).
 *
 * <p>실 카카오 비즈니스 API 미연동 상태이므로 실제 발송은 수행하지 않고, 발송 시도만
 * {@code syh_send_msg_log} (channel_cd=KAKAO) 에 FAILED 로 기록한다.
 * 향후 실 API 연동 시 본 서비스 내부 발송 로직만 교체하면 된다.</p>
 *
 * <p>이력 저장 실패는 {@code log.error} 로만 남기고 예외를 위로 던지지 않는다.
 * 발송 결과는 항상 {@link SendResultVo} 로 반환한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmKakaoSendService {

    private static final String CHANNEL_KAKAO  = "KAKAO";
    private static final String RESULT_FAILED  = "FAILED";

    private final SyhSendMsgLogRepository syhSendMsgLogRepository;

    /* ─────────────────────────────────────────────────────────────
     * 공개 발송 메서드
     * ───────────────────────────────────────────────────────────── */

    /**
     * 카카오 알림톡을 발송한다. (실 API 미연동 — 시도만 기록)
     *
     * @param siteId       사이트ID
     * @param recvPhone    수신 전화번호
     * @param content      발송 내용 (치환 완료본)
     * @param kakaoTplCode 카카오 알림톡 템플릿 코드
     * @param templateId   템플릿ID (sy_template.template_id)
     * @param templateCode 템플릿코드 스냅샷
     * @param refTypeCd    연관유형코드 (ORDER/CLAIM/JOIN/AUTH/CONTACT 등)
     * @param refId        연관ID
     * @param params       치환 파라미터 (이력 JSON 기록용)
     * @return 발송 결과 VO (channel=KAKAO, 항상 success=false)
     */
    @Transactional
    public SendResultVo sendKakao(String siteId, String recvPhone, String content,
                                  String kakaoTplCode, String templateId, String templateCode,
                                  String refTypeCd, String refId, Map<String, Object> params) {

        // 실 카카오 비즈니스 API 미연동 → 항상 발송 실패로 기록
        String resultCd   = RESULT_FAILED;
        String failReason = "카카오 알림톡 API 미연동 (발송 시도만 기록)";
        if (recvPhone == null || recvPhone.isBlank()) {
            failReason = "수신 전화번호 없음 + 카카오 API 미연동";
        }
        log.info("[CmKakaoSend] 카카오 알림톡 발송 시도 (미연동) → phone={}, refId={}", recvPhone, refId);

        String logId = null;
        try {
            SyhSendMsgLog logRow = new SyhSendMsgLog();
            logId = CmUtil.generateId("syh_send_msg_log");
            logRow.setLogId(logId);
            logRow.setSiteId(siteId);
            logRow.setChannelCd(CHANNEL_KAKAO);
            logRow.setTemplateId(templateId);
            logRow.setTemplateCode(templateCode);
            logRow.setRecvPhone(recvPhone);
            logRow.setContent(content);
            logRow.setParams(CmUtil.toJsonParams(params));
            logRow.setKakaoTplCode(kakaoTplCode);
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
            log.error("[CmKakaoSend] 카카오 발송 이력 저장 실패 (refId={})", refId, e);
        }

        return SendResultVo.builder()
            .channel(CHANNEL_KAKAO)
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

    private static String nz(String s) { return s == null ? "" : s; }

    private static String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
