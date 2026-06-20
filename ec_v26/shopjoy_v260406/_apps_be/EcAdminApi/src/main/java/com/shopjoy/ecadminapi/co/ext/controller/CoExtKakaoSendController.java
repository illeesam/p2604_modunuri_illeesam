package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmKakaoSendService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 외부 연동 — 카카오 채널(알림톡/친구톡) 발송  /api/co/ext/kakao-send
 */
@RestController
@RequestMapping("/api/co/ext/kakao-send")
@RequiredArgsConstructor
public class CoExtKakaoSendController {

    private final CmKakaoSendService cmKakaoSendService;

    /** POST /api/co/ext/kakao-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<SendResultVo>> send(@RequestBody Map<String, Object> body) {
        String siteId       = SecurityUtil.getSiteId();
        String toPhone      = str(body, "toPhone");
        String templateCode = str(body, "templateCode");
        String content      = str(body, "content");

        @SuppressWarnings("unchecked")
        Map<String, Object> variables = body.get("variables") instanceof Map
                ? (Map<String, Object>) body.get("variables")
                : Map.of();

        SendResultVo result = cmKakaoSendService.sendKakao(
                siteId, toPhone, content,
                templateCode, null, templateCode,
                "TEST", null, variables);

        return result.getSuccess()
                ? ResponseEntity.ok(ApiResponse.ok(result))
                : ResponseEntity.ok(ApiResponse.error(400, result.getFailReason(), result));
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }
}
