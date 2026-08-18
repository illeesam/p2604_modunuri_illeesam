package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMailSendService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import jakarta.validation.Valid;
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
        String toEmail = CmUtil.mapStr(body, "toEmail");
        String toName  = CmUtil.mapStr(body, "toName");
        String subject = CmUtil.mapStr(body, "subject");
        String text    = CmUtil.mapStr(body, "body");

        String content = (toName != null && !toName.isBlank())
                ? toName + " 님,<br><br>" + CmUtil.nvlStr(text).replace("\n", "<br>")
                : CmUtil.nvlStr(text).replace("\n", "<br>");

        SendResultVo result = cmMailSendService.sendMail(
                siteId, toEmail, subject, content,
                null, null, "TEST", null, Map.of("toName", CmUtil.nvlStr(toName)));

        return result.getSuccess()
                ? ResponseEntity.ok(ApiResponse.ok(result))
                : ResponseEntity.ok(ApiResponse.error(400, result.getFailReason(), result));
    }

}
