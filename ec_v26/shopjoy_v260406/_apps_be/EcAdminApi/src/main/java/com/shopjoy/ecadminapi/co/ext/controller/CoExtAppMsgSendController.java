package com.shopjoy.ecadminapi.co.ext.controller;

import com.shopjoy.ecadminapi.base.ec.cm.repository.CmhPushLogRepository;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbDeviceTokenRepository;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 외부 연동 — 앱 메시지 통합 발송  /api/co/ext/app-msg-send
 * FCM/APNs/SMS/카카오/InApp 채널별 시뮬레이션 응답 반환.
 */
@Slf4j
@RestController
@RequestMapping("/api/co/ext/app-msg-send")
@RequiredArgsConstructor
public class CoExtAppMsgSendController {

    private final MbDeviceTokenRepository mbDeviceTokenRepository;
    private final CmhPushLogRepository cmhPushLogRepository;

    /** POST /api/co/ext/app-msg-send/send */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> send(@RequestBody Map<String, Object> body) {
        String targetMode  = str(body, "targetMode");
        String targetValue = str(body, "targetValue");
        String title       = str(body, "title");
        @SuppressWarnings("unchecked")
        List<String> channels = (List<String>) body.getOrDefault("channels", List.of());

        log.info("[CoExtAppMsgSend] targetMode={} channels={} title={}", targetMode, channels, title);

        long ts = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();

        for (String ch : channels) {
            switch (ch.toUpperCase()) {
                case "FCM":
                    result.put("fcm", Map.of(
                        "success",   true,
                        "messageId", "SIM-FCM-" + ts,
                        "note",      "시뮬레이션"
                    ));
                    break;
                case "APNS":
                    result.put("apns", Map.of(
                        "success", true,
                        "apnsId",  "SIM-APNS-" + ts,
                        "note",    "시뮬레이션"
                    ));
                    break;
                case "SMS":
                    result.put("sms", Map.of(
                        "success", true,
                        "msgId",   "SIM-SMS-" + ts,
                        "note",    "시뮬레이션"
                    ));
                    break;
                case "KAKAO":
                    result.put("kakao", Map.of(
                        "success", true,
                        "msgId",   "SIM-KAKAO-" + ts,
                        "note",    "시뮬레이션"
                    ));
                    break;
                case "INAPP":
                    result.put("inapp", Map.of(
                        "success", true,
                        "msgId",   "SIM-INAPP-" + ts,
                        "note",    "WebSocket 미연결 시 시뮬레이션"
                    ));
                    break;
                default:
                    break;
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/co/ext/app-msg-send/tokens */
    @GetMapping("/tokens")
    public ResponseEntity<ApiResponse<Map<String, Object>>> tokens(@RequestParam Map<String, Object> p) {
        String platform = str(p, "platform");
        String memberId = str(p, "memberId");
        int pageSize    = toInt(p.get("pageSize"), 20);

        List<MbDeviceTokenDto.Item> items = mbDeviceTokenRepository.findAll().stream()
                .filter(t -> platform == null || platform.isBlank() || platform.equalsIgnoreCase(t.getOsType()))
                .filter(t -> memberId == null || memberId.isBlank() || memberId.equals(t.getMemberId()))
                .limit(pageSize)
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

        // 프론트가 기대하는 pageList / pageTotalCount 구조로 반환
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pageList", items);
        result.put("pageTotalCount", items.size());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** GET /api/co/ext/app-msg-send/history */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> history(@RequestParam Map<String, Object> p) {
        // cmh_push_log 실 조회는 별도 구현 예정 — 현재 빈 목록 반환 (시뮬레이션)
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pageList", List.of());
        result.put("pageTotalCount", 0);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────────
    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }

    private static int toInt(Object v, int def) {
        if (v == null) return def;
        try { return ((Number) v).intValue(); } catch (Exception e) { return def; }
    }
}
