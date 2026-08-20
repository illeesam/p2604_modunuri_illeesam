package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhAlarmSendHistDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String sendHistId;  // 발송이력ID
        @Size(max = 20) private String status;  // 상태
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_alarm_send_hist ──────────────────────────────────────────
        private String sendHistId;  // 발송이력ID
        private String alarmId;  // 알림ID
        private String memberId;  // 수신자 회원ID
        private String userId;  // 수신자 사용자ID (sy_user.user_id)
        private String channel;  // 발송채널
        private String sendTo;  // 수신처 (이메일/전화/토큰)
        private LocalDateTime sendDate;  // 발송일시
        private String sendHistStatusCd;  // 발송결과 (SENT/FAILED)
        private String errorMsg;  // 오류메시지
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
