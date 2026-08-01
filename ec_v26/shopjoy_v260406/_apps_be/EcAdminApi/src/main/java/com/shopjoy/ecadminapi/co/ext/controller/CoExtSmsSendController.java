package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmSmsSendService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 외부 연동 — SMS 발송  /api/co/ext/sms-send
 */
@RestController
@RequestMapping("/api/co/ext/sms-send")
@RequiredArgsConstructor
public class CoExtSmsSendController {

    private final CmSmsSendService cmSmsSendService;

    /** POST /api/co/ext/sms-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<SendResultVo>> send(@RequestBody Map<String, Object> body) {
        String siteId  = SecurityUtil.getSiteId();
        String toPhone = CmUtil.mapStr(body, "toPhone");
        String message = CmUtil.mapStr(body, "message");

        SendResultVo result = cmSmsSendService.sendSms(
                siteId, toPhone, null,
                "[ShopJoy] 테스트", message,
                null, null, "TEST", null, Map.of());

        return result.getSuccess()
                ? ResponseEntity.ok(ApiResponse.ok(result))
                : ResponseEntity.ok(ApiResponse.error(400, result.getFailReason(), result));
    }

}
