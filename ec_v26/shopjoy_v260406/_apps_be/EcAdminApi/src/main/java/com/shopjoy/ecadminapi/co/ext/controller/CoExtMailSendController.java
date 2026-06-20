package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMailSendService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 외부 연동 — 메일(SMTP) 발송  /api/co/ext/mail-send
 */
@RestController
@RequestMapping("/api/co/ext/mail-send")
@RequiredArgsConstructor
public class CoExtMailSendController {

    private final CmMailSendService cmMailSendService;

    /** POST /api/co/ext/mail-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<SendResultVo>> send(@RequestBody Map<String, Object> body) {
        String siteId  = SecurityUtil.getSiteId();
        String toEmail = str(body, "toEmail");
        String toName  = str(body, "toName");
        String subject = str(body, "subject");
        String text    = str(body, "body");

        String content = (toName != null && !toName.isBlank())
                ? toName + " 님,<br><br>" + nz(text).replace("\n", "<br>")
                : nz(text).replace("\n", "<br>");

        SendResultVo result = cmMailSendService.sendMail(
                siteId, toEmail, subject, content,
                null, null, "TEST", null, Map.of("toName", nz(toName)));

        return result.getSuccess()
                ? ResponseEntity.ok(ApiResponse.ok(result))
                : ResponseEntity.ok(ApiResponse.error(400, result.getFailReason(), result));
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }
    private static String nz(String s) { return s == null ? "" : s; }
}
