package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 메시지 발송 오케스트레이터 (BO/FO 공통, co 레이어).
 *
 * <p>채널별 발송 서비스(메일/카카오/SMS/시스템알림)를 조합하고, sy_template 을 templateCode 로
 * 조회·치환한 뒤 각 채널 서비스에 위임한다. 업무 시나리오별 진입점(예: sendContactReceived)을 제공한다.</p>
 *
 * <ul>
 *   <li>메일   : {@link CmMailSendService}  → syh_send_email_log</li>
 *   <li>카카오 : {@link CmKakaoSendService} → syh_send_msg_log (channel_cd=KAKAO)</li>
 *   <li>SMS    : {@link CmSmsSendService}   → syh_send_msg_log (channel_cd=SMS)</li>
 *   <li>시스템 : {@link CmAlarmSendService} → sy_alarm + syh_alarm_send_hist</li>
 * </ul>
 *
 * <p>각 채널은 독립적으로 실패해도 나머지 채널·호출 흐름에 영향을 주지 않는다(채널 서비스가
 * 예외를 삼키고 SendResultVo.success=false 로 반환).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmMsgSendService {

    private static final String DEFAULT_SITE_ID = "2604010000000001";

    private final SyTemplateRepository syTemplateRepository;
    private final CmMailSendService  cmMailSendService;
    private final CmKakaoSendService cmKakaoSendService;
    private final CmSmsSendService   cmSmsSendService;
    private final CmAlarmSendService cmAlarmSendService;

    /* ─────────────────────────────────────────────────────────────
     * 업무 진입점
     * ───────────────────────────────────────────────────────────── */

    /**
     * 고객센터 문의 접수 완료 알림을 **비동기**로 발송한다 (fire-and-forget).
     *
     * <p>문의 접수 응답이 메일 SMTP 발송(수 초) 등으로 지연되지 않도록 별도 스레드풀
     * ({@code msgSendExecutor})에서 처리한다. 발송 결과는 호출자에게 반환하지 않고 이력 테이블에만
     * 기록한다. 예외는 {@link com.shopjoy.ecadminapi.common.config.AsyncConfig} 의 핸들러가 로깅한다.</p>
     *
     * <p>주의: @Async 스레드에는 SecurityContext 가 전파되지 않아 이력 reg_by 는 GUEST 로 기록된다
     * (발송 주체는 시스템이므로 의도된 동작).</p>
     */
    @Async("msgSendExecutor")
    public void sendContactReceivedAsync(String siteId, String blogId, String name,
                                         String email, String tel, String inquiryType) {
        try {
            sendContactReceived(siteId, blogId, name, email, tel, inquiryType);
        } catch (Exception e) {
            log.error("[CmMsgSend] 문의접수 알림 비동기 발송 실패 (blogId={})", blogId, e);
        }
    }

    /**
     * 고객센터 문의 접수 완료 알림을 3개 채널(메일/카카오/시스템알림)로 **동기** 발송한다.
     * 결과를 즉시 확인해야 하는 컨트롤러/테스트용. 일반 업무 흐름은 {@link #sendContactReceivedAsync} 사용.
     *
     * @param siteId      사이트ID (null 이면 대표 사이트)
     * @param blogId      문의 글ID (cm_blog.blog_id) — 이력 ref_id 로 기록
     * @param name        문의자 이름
     * @param email       문의자 이메일 (메일 수신처)
     * @param tel         문의자 연락처 (카카오 수신처)
     * @param inquiryType 문의 유형
     * @return 채널별 발송 결과 목록
     */
    @Transactional
    public List<SendResultVo> sendContactReceived(String siteId, String blogId, String name,
                                                  String email, String tel, String inquiryType) {
        String sid = nzSite(siteId);
        Map<String, Object> params = Map.of(
            "name",        nz(name),
            "inquiryType", nz(inquiryType),
            "email",       nz(email),
            "tel",         nz(tel)
        );
        List<SendResultVo> results = new ArrayList<>();

        // 1) 메일
        Tpl mail = resolve(sid, "CONTACT_RECEIVED_MAIL", params);
        String mailSubject = mail.subject != null ? mail.subject : "[ShopJoy] 문의가 정상 접수되었습니다.";
        String mailContent = mail.content != null ? mail.content
            : ("안녕하세요 " + nz(name) + "님,\n\n문의가 정상적으로 접수되었습니다. 빠르게 답변드리겠습니다.\n\n- ShopJoy 고객센터");
        results.add(cmMailSendService.sendMail(sid, email, mailSubject, mailContent,
            mail.templateId, "CONTACT_RECEIVED_MAIL", "CONTACT", blogId, params));

        // 2) 카카오 알림톡
        Tpl kakao = resolve(sid, "CONTACT_RECEIVED_KAKAO", params);
        String kakaoContent = kakao.content != null ? kakao.content
            : ("[ShopJoy] " + nz(name) + "님, 문의가 정상 접수되었습니다.");
        results.add(cmKakaoSendService.sendKakao(sid, tel, kakaoContent,
            kakao.templateCode != null ? kakao.templateCode : "CONTACT_RECEIVED_KAKAO",
            kakao.templateId, "CONTACT_RECEIVED_KAKAO", "CONTACT", blogId, params));

        // 3) 시스템 알림
        Tpl alarm = resolve(sid, "CONTACT_RECEIVED_ALARM", params);
        String alarmTitle = alarm.subject != null ? alarm.subject : "신규 문의 접수";
        String alarmMsg   = alarm.content != null ? alarm.content
            : (nz(name) + "님이 문의를 접수했습니다. (" + nz(inquiryType) + ")");
        results.add(cmAlarmSendService.sendSystemAlarm(sid, alarmTitle, alarmMsg, "CONTACT",
            null, email, alarm.templateId, blogId, params));

        return results;
    }

    /* ─────────────────────────────────────────────────────────────
     * 범용 단건 발송 (컨트롤러/타 업무에서 직접 사용)
     * ───────────────────────────────────────────────────────────── */

    /** 템플릿코드로 메일 발송 (템플릿 없으면 인자 subject/content 그대로 사용). */
    @Transactional
    public SendResultVo sendMailByTemplate(String siteId, String toAddr, String templateCode,
                                           String fallbackSubject, String fallbackContent,
                                           String refTypeCd, String refId, Map<String, Object> params) {
        String sid = nzSite(siteId);
        Tpl t = resolve(sid, templateCode, params);
        return cmMailSendService.sendMail(sid, toAddr,
            t.subject != null ? t.subject : fallbackSubject,
            t.content != null ? t.content : fallbackContent,
            t.templateId, templateCode, refTypeCd, refId, params);
    }

    /** 템플릿코드로 카카오 알림톡 발송. */
    @Transactional
    public SendResultVo sendKakaoByTemplate(String siteId, String recvPhone, String templateCode,
                                            String fallbackContent, String refTypeCd, String refId,
                                            Map<String, Object> params) {
        String sid = nzSite(siteId);
        Tpl t = resolve(sid, templateCode, params);
        return cmKakaoSendService.sendKakao(sid, recvPhone,
            t.content != null ? t.content : fallbackContent,
            templateCode, t.templateId, templateCode, refTypeCd, refId, params);
    }

    /** 템플릿코드로 SMS 발송. */
    @Transactional
    public SendResultVo sendSmsByTemplate(String siteId, String recvPhone, String senderPhone, String title,
                                          String templateCode, String fallbackContent, String refTypeCd,
                                          String refId, Map<String, Object> params) {
        String sid = nzSite(siteId);
        Tpl t = resolve(sid, templateCode, params);
        return cmSmsSendService.sendSms(sid, recvPhone, senderPhone, title,
            t.content != null ? t.content : fallbackContent,
            t.templateId, templateCode, refTypeCd, refId, params);
    }

    /** 시스템 알림 발송 (템플릿 없이 제목/본문 직접). */
    @Transactional
    public SendResultVo sendSystemAlarm(String siteId, String title, String msg, String alarmTypeCd,
                                        String memberId, String sendTo, String refId, Map<String, Object> params) {
        return cmAlarmSendService.sendSystemAlarm(nzSite(siteId), title, msg, alarmTypeCd, memberId, sendTo, null, refId, params);
    }

    /* ─────────────────────────────────────────────────────────────
     * 내부 헬퍼
     * ───────────────────────────────────────────────────────────── */

    /** 치환 완료된 제목/본문 + templateId/templateCode 묶음. */
    private static class Tpl {
        String templateId;
        String templateCode;
        String subject;   // 치환 완료 (없으면 null)
        String content;   // 치환 완료 (없으면 null)
    }

    /** 사이트+코드로 사용중(Y) 템플릿 조회 후 파라미터 치환. 없으면 빈 Tpl(모두 null). */
    private Tpl resolve(String siteId, String templateCode, Map<String, Object> params) {
        Tpl t = new Tpl();
        t.templateCode = templateCode;
        try {
            SyTemplate tpl = syTemplateRepository
                .findFirstBySiteIdAndTemplateCodeAndUseYn(siteId, templateCode, "Y").orElse(null);
            if (tpl != null) {
                t.templateId = tpl.getTemplateId();
                t.subject = tpl.getTemplateSubject() != null ? CmUtil.fillTemplate(tpl.getTemplateSubject(), params) : null;
                t.content = tpl.getTemplateContent() != null ? CmUtil.fillTemplate(tpl.getTemplateContent(), params) : null;
            }
        } catch (Exception e) {
            log.warn("[CmMsgSend] 템플릿 조회 실패 (code={}): {}", templateCode, e.getMessage());
        }
        return t;
    }

    private static String nz(String s) { return s == null ? "" : s; }

    private static String nzSite(String siteId) {
        return (siteId == null || siteId.isBlank()) ? DEFAULT_SITE_ID : siteId;
    }
}
