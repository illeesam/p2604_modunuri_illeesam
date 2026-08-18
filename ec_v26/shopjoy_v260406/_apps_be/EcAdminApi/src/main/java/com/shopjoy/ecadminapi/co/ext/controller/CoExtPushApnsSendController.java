package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbDeviceTokenRepository;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
/**
 * 외부 연동 — APNs 푸시 알림 (iOS)  /api/co/ext/push-apns-send
 * APNs 실발송 서비스 미구현 — 시뮬레이션 응답 반환.
 */
@Slf4j
@RestController
@RequestMapping("/api/co/ext/push-apns-send")
@RequiredArgsConstructor
public class CoExtPushApnsSendController {

    private final MbDeviceTokenRepository mbDeviceTokenRepository;

    /** POST /api/co/ext/push-apns-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> send(@RequestBody Map<String, Object> body) {
        String deviceToken = CmUtil.mapStr(body, "deviceToken");
        String title       = CmUtil.mapStr(body, "title");
        String msgBody     = CmUtil.mapStr(body, "body");

        log.info("[CoExtPushApnsSend] deviceToken={}... title={}",
                deviceToken != null && deviceToken.length() > 16 ? deviceToken.substring(0, 16) : deviceToken, title);

        Map<String, Object> result = Map.of(
                "apnsId",      "TEST-APNS-" + System.currentTimeMillis(),
                "deviceToken", deviceToken != null && deviceToken.length() > 20
                        ? deviceToken.substring(0, 20) + "…" : CmUtil.nvlStr(deviceToken),
                "title",       CmUtil.nvlStr(title),
                "body",        CmUtil.nvlStr(msgBody),
                "note",        "APNs 실발송 서비스 미구현 — 시뮬레이션 응답"
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/co/ext/push-apns-send/tokens */
    @GetMapping("/tokens")
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto.Item>>> tokens() {

        List<MbDeviceTokenDto.Item> items = mbDeviceTokenRepository.findAll().stream()
                .filter(t -> "IOS".equalsIgnoreCase(t.getOsTypeCd()))
                .limit(50)
                .map(t -> {
                    MbDeviceTokenDto.Item item = new MbDeviceTokenDto.Item();
                    item.setDeviceTokenId(t.getDeviceTokenId());
                    item.setDeviceToken(t.getDeviceToken());
                    item.setMemberId(t.getMemberId());
                    item.setOsTypeCd(t.getOsTypeCd());
                    item.setRegDate(t.getRegDate());
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(items));
    }

}
