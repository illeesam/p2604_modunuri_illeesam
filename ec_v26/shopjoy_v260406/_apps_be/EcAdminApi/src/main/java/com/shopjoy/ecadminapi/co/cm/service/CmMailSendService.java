package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 메일 발송 단일 책임 서비스 (co 레이어).
 *
 * <p>JavaMailSender 로 HTML 메일을 실발송하고, 발송 결과를 {@code syh_send_email_log} 에 기록한다.
 * 발송 실패·이력 저장 실패가 발생해도 예외를 위로 던지지 않고 {@link SendResultVo} 의
 * {@code success=false} 로 반환하여, 호출 측(오케스트레이터)의 본 흐름에 영향을 주지 않는다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmMailSendService {

    private static final String CHANNEL_EMAIL  = "EMAIL";
    private static final String RESULT_SUCCESS  = "SUCCESS";
    private static final String RESULT_FAILED   = "FAILED";

    private final SyhSendEmailLogRepository syhSendEmailLogRepository;

    /** JavaMailSender — 메일 설정 미존재 시 null (앱 기동은 유지). */
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:illeesam4@gmail.com}")
    private String mailFrom;

    @Value("${app.mail.from-nm:ShopJoy}")
    private String mailFromNm;

    /* ─────────────────────────────────────────────────────────────
     * 공개 메서드: 메일 발송
     * ───────────────────────────────────────────────────────────── */

    /**
     * HTML 메일을 실발송하고 {@code syh_send_email_log} 에 결과를 기록한다.
     *
     * <p>발송 실패 시 예외를 던지지 않고 {@code success=false} 인 {@link SendResultVo} 를 반환한다.</p>
     *
     * @param siteId       사이트ID
     * @param toAddr       수신 이메일 (NOT NULL)
     * @param subject      발송 제목 (치환 완료본)
     * @param content      발송 본문 (치환 완료본, HTML 또는 텍스트)
     * @param templateId   템플릿ID (없으면 null)
     * @param templateCode 템플릿코드 스냅샷 (없으면 null)
     * @param refTypeCd    연관유형코드 (ORDER/CLAIM/CONTACT 등)
     * @param refId        연관ID
     * @param params       치환 파라미터 (이력 params 컬럼에 JSON 으로 기록)
     * @return 발송 결과 VO (channel="EMAIL")
     */
    @Transactional
    public SendResultVo sendMail(String siteId, String toAddr, String subject, String content,
                                 String templateId, String templateCode,
                                 String refTypeCd, String refId, Map<String, Object> params) {

        String resultCd   = RESULT_SUCCESS;
        String failReason = null;
        try {
            doSendEmail(toAddr, subject, content);
            log.info("[CmMailSend] 메일 발송 성공 → {}", toAddr);
        } catch (Exception e) {
            resultCd   = RESULT_FAILED;
            failReason = CmUtil.describeError(e, 500);
            log.warn("[CmMailSend] 메일 발송 실패 → {} : {}", toAddr, failReason);
        }

        String logId = null;
        try {
            SyhSendEmailLog logRow = new SyhSendEmailLog();
            logId = CmUtil.generateId("syh_send_email_log");
            logRow.setLogId(logId);
            logRow.setSiteId(siteId);
            logRow.setTemplateId(templateId);
            logRow.setTemplateCode(templateCode);
            logRow.setFromAddr(mailFrom);
            logRow.setToAddr(toAddr);
            logRow.setSubject(subject);
            logRow.setContent(content);
            logRow.setParams(CmUtil.toJsonParams(params));
            logRow.setResultCd(resultCd);
            logRow.setFailReason(failReason);
            logRow.setSendDate(LocalDateTime.now());
            logRow.setRefTypeCd(refTypeCd);
            logRow.setRefId(refId);
            stampReg(logRow);
            syhSendEmailLogRepository.save(logRow);
        } catch (Exception e) {
            log.error("[CmMailSend] 메일 발송 이력 저장 실패 (toAddr={})", toAddr, e);
        }

        return SendResultVo.builder()
            .channel(CHANNEL_EMAIL)
            .success(RESULT_SUCCESS.equals(resultCd))
            .resultCd(resultCd)
            .logId(logId)
            .failReason(failReason)
            .build();
    }

    /* ─────────────────────────────────────────────────────────────
     * 내부 헬퍼
     * ───────────────────────────────────────────────────────────── */

    /** 실제 메일 발송 (HTML 본문). JavaMailSender 미존재 시 예외. */
    private void doSendEmail(String toAddr, String subject, String content) throws Exception {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) throw new IllegalStateException("JavaMailSender 미설정 (spring.mail.* 누락)");
        MimeMessage mime = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
        helper.setTo(toAddr);
        helper.setSubject(subject);
        // 본문에 HTML 태그가 없으면 줄바꿈을 <br>로 변환해 가독성 유지
        boolean looksHtml = content != null && content.contains("<") && content.contains(">");
        helper.setText(looksHtml ? content : nz(content).replace("\n", "<br>"), true);
        try {
            helper.setFrom(mailFrom, mailFromNm);
        } catch (Exception ignore) {
            helper.setFrom(mailFrom);
        }
        sender.send(mime);
    }

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
