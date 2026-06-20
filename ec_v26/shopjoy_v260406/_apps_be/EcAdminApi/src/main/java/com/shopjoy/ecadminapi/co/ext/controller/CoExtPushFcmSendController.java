package com.shopjoy.ecadminapi.co.ext.controller;

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

/**
 * 외부 연동 — FCM 푸시 알림  /api/co/ext/push-fcm-send
 * FCM 실발송 서비스 미구현 — 시뮬레이션 응답 반환.
 */
@Slf4j
@RestController
@RequestMapping("/api/co/ext/push-fcm-send")
@RequiredArgsConstructor
public class CoExtPushFcmSendController {

    private final MbDeviceTokenRepository mbDeviceTokenRepository;

    /** POST /api/co/ext/push-fcm-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> send(@RequestBody Map<String, Object> body) {
        String targetType  = str(body, "targetType");
        String targetValue = str(body, "targetValue");
        String title       = str(body, "title");
        String msgBody     = str(body, "body");

        log.info("[CoExtPushFcmSend] targetType={} title={}", targetType, title);

        Map<String, Object> result = Map.of(
                "messageId",   "projects/shopjoy/messages/TEST-" + System.currentTimeMillis(),
                "targetType",  nz(targetType),
                "targetValue", nz(targetValue),
                "title",       nz(title),
                "body",        nz(msgBody),
                "note",        "FCM 실발송 서비스 미구현 — 시뮬레이션 응답"
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/co/ext/push-fcm-send/tokens */
    @GetMapping("/tokens")
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto.Item>>> tokens(
            @RequestParam(required = false) String platform) {

        List<MbDeviceTokenDto.Item> items = mbDeviceTokenRepository.findAll().stream()
                .filter(t -> platform == null || platform.equalsIgnoreCase(t.getOsType()))
                .limit(50)
                .map(t -> {
                    MbDeviceTokenDto.Item item = new MbDeviceTokenDto.Item();
                    item.setDeviceTokenId(t.getDeviceTokenId());
                    item.setDeviceToken(t.getDeviceToken());
                    item.setSiteId(t.getSiteId());
                    item.setMemberId(t.getMemberId());
                    item.setOsType(t.getOsType());
                    item.setRegDate(t.getRegDate());
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }
    private static String nz(String s) { return s == null ? "" : s; }
}
