package com.shopjoy.ecBeBo.co.ext.controller;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecBeBo.co.cm.service.CmKakaoSendService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import jakarta.validation.Valid;
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
        String toPhone      = CmUtil.mapStr(body, "toPhone");
        String templateCode = CmUtil.mapStr(body, "templateCode");
        String content      = CmUtil.mapStr(body, "content");

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

}
