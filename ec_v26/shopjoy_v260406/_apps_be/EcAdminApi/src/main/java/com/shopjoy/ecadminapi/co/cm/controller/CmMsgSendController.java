package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.data.vo.MsgSendReq;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 메시지 발송 API (BO/FO 공통, co 레이어).
 *
 * <p>채널별 수동/테스트 발송 엔드포인트. 실제 업무 발송은 보통 서비스 간 직접 호출
 * (예: FoCmContactService → CmMsgSendService.sendContactReceived)로 이루어지며,
 * 본 컨트롤러는 관리자 테스트·재발송·외부 트리거용이다.</p>
 *
 * <ul>
 *   <li>POST /api/co/cm/send/mail   — 메일 발송 (templateCode 우선, 없으면 subject/content)</li>
 *   <li>POST /api/co/cm/send/kakao  — 카카오 알림톡 발송 (미연동 — 시도/이력만)</li>
 *   <li>POST /api/co/cm/send/sms    — SMS 발송 (미연동 — 시도/이력만)</li>
 *   <li>POST /api/co/cm/send/alarm  — 시스템 알림 발송</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/co/cm/send")
@RequiredArgsConstructor
public class CmMsgSendController {

    private final CmMsgSendService cmMsgSendService;

    /** mail — 메일 발송 */
    @PostMapping("/mail")
    public ResponseEntity<ApiResponse<SendResultVo>> mail(@RequestBody MsgSendReq req) {
        SendResultVo r = cmMsgSendService.sendMailByTemplate(
            req.getSiteId(), req.getToAddr(), req.getTemplateCode(),
            req.getSubject(), req.getContent(), req.getRefTypeCd(), req.getRefId(), params(req));
        return ResponseEntity.ok(ApiResponse.ok(r));
    }

    /** kakao — 카카오 알림톡 발송 */
    @PostMapping("/kakao")
    public ResponseEntity<ApiResponse<SendResultVo>> kakao(@RequestBody MsgSendReq req) {
        SendResultVo r = cmMsgSendService.sendKakaoByTemplate(
            req.getSiteId(), req.getRecvPhone(), req.getTemplateCode(),
            req.getContent(), req.getRefTypeCd(), req.getRefId(), params(req));
        return ResponseEntity.ok(ApiResponse.ok(r));
    }

    /** sms — SMS 발송 */
    @PostMapping("/sms")
    public ResponseEntity<ApiResponse<SendResultVo>> sms(@RequestBody MsgSendReq req) {
        SendResultVo r = cmMsgSendService.sendSmsByTemplate(
            req.getSiteId(), req.getRecvPhone(), req.getSenderPhone(), req.getSubject(),
            req.getTemplateCode(), req.getContent(), req.getRefTypeCd(), req.getRefId(), params(req));
        return ResponseEntity.ok(ApiResponse.ok(r));
    }

    /** alarm — 시스템 알림 발송 */
    @PostMapping("/alarm")
    public ResponseEntity<ApiResponse<SendResultVo>> alarm(@RequestBody MsgSendReq req) {
        SendResultVo r = cmMsgSendService.sendSystemAlarm(
            req.getSiteId(), req.getSubject(), req.getContent(), req.getAlarmTypeCd(),
            req.getMemberId(), req.getSendTo(), req.getRefId(), params(req));
        return ResponseEntity.ok(ApiResponse.ok(r));
    }

    /** params — null 안전 (치환 파라미터 미전달 시 빈 맵) */
    private Map<String, Object> params(MsgSendReq req) {
        return req.getParams() != null ? req.getParams() : new HashMap<>();
    }
}
