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
        String deviceToken = str(body, "deviceToken");
        String title       = str(body, "title");
        String msgBody     = str(body, "body");

        log.info("[CoExtPushApnsSend] deviceToken={}... title={}",
                deviceToken != null && deviceToken.length() > 16 ? deviceToken.substring(0, 16) : deviceToken, title);

        Map<String, Object> result = Map.of(
                "apnsId",      "TEST-APNS-" + System.currentTimeMillis(),
                "deviceToken", deviceToken != null && deviceToken.length() > 20
                        ? deviceToken.substring(0, 20) + "…" : nz(deviceToken),
                "title",       nz(title),
                "body",        nz(msgBody),
                "note",        "APNs 실발송 서비스 미구현 — 시뮬레이션 응답"
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/co/ext/push-apns-send/tokens */
    @GetMapping("/tokens")
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto.Item>>> tokens() {

        List<MbDeviceTokenDto.Item> items = mbDeviceTokenRepository.findAll().stream()
                .filter(t -> "IOS".equalsIgnoreCase(t.getOsType()))
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
