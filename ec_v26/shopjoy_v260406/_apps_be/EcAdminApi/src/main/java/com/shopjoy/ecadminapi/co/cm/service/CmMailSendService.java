package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * 메일 발송 단일 책임 서비스 (co 레이어).
 *
 * <p>발송 시점마다 sy_prop 에서 SMTP 설정을 읽어 JavaMailSenderImpl 을 직접 생성한다.
 * Spring 빈 JavaMailSender 에 의존하지 않으므로 application.yml 에 spring.mail.* 불필요.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmMailSendService {

    private static final String CHANNEL_EMAIL = "EMAIL";
    private static final String RESULT_SUCCESS = "SUCCESS";
    private static final String RESULT_FAILED  = "FAILED";

    private final SyhSendEmailLogRepository syhSendEmailLogRepository;
    private final SyPropRepository syPropRepository;

    /* ─────────────────────────────────────────────────────────────
     * 공개 메서드: 메일 발송
     * ───────────────────────────────────────────────────────────── */

    @Transactional
    public SendResultVo sendMail(String siteId, String toAddr, String subject, String content,
                                 String templateId, String templateCode,
                                 String refTypeCd, String refId, Map<String, Object> params) {

        SmtpConfig cfg = loadSmtpConfig();

        String resultCd   = RESULT_SUCCESS;
        String failReason = null;
        try {
            doSendEmail(cfg, toAddr, subject, content);
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
            logRow.setFromAddr(cfg.from);
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

    /** sy_prop 에서 SMTP 설정을 읽어 발송 시점마다 JavaMailSenderImpl 을 생성해 발송. */
    private void doSendEmail(SmtpConfig cfg, String toAddr, String subject, String content) throws Exception {
        if (cfg.host == null || cfg.host.isBlank())
            throw new IllegalStateException("SMTP 설정 누락 (sy_prop: spring.mail.host)");

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(nz(cfg.host));
        sender.setPort(cfg.port);
        sender.setUsername(nz(cfg.username));
        sender.setPassword(nz(cfg.password));
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        MimeMessage mime = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
        helper.setTo(nz(toAddr));
        helper.setSubject(nz(subject));
        boolean looksHtml = content != null && content.contains("<") && content.contains(">");
        helper.setText(looksHtml ? nz(content) : nz(content).replace("\n", "<br>"), true);
        try {
            helper.setFrom(nz(cfg.from), nz(cfg.fromNm));
        } catch (Exception ignore) {
            helper.setFrom(nz(cfg.from));
        }
        sender.send(mime);
    }

    /** sy_prop 전체 로드 후 spring.mail.* / app.mail.* 값 추출. */
    private SmtpConfig loadSmtpConfig() {
        List<SyProp> all = syPropRepository.findAll();
        SmtpConfig cfg = new SmtpConfig();
        for (SyProp p : all) {
            if (p.getPropValue() == null || p.getPropValue().isBlank()) continue;
            switch (nz(p.getPropKey())) {
                case "spring.mail.host"     -> cfg.host     = p.getPropValue();
                case "spring.mail.port"     -> { try { cfg.port = Integer.parseInt(p.getPropValue().trim()); } catch (Exception ignore) {} }
                case "spring.mail.username" -> cfg.username = p.getPropValue();
                case "spring.mail.password" -> cfg.password = p.getPropValue();
                case "app.mail.from"        -> cfg.from     = p.getPropValue();
                case "app.mail.from-nm"     -> cfg.fromNm   = p.getPropValue();
            }
        }
        if (cfg.from == null || cfg.from.isBlank()) cfg.from = cfg.username; // fallback
        return cfg;
    }

    private static class SmtpConfig {
        String host;
        int    port     = 587;
        String username;
        String password;
        String from;
        String fromNm   = "ShopJoy";
    }

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
