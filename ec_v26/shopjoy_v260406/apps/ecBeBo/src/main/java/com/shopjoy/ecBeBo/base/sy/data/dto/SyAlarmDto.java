package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAlarmDto {

    /** 조회 요청 */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String alarmId;  // 알림ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 20) private String status;  // 발송상태 필터 — ALARM_STATUS {PENDING:대기, SENT:발송완료, FAILED:실패, CANCELLED:취소}
        @Size(max = 20) private String typeCd;  // 알림유형 필터 — ALARM_TYPE_CD {ORDER:주문, DELIVERY:배송, CLAIM:클레임, MARKETING:마케팅, SYSTEM:시스템, CONTACT:문의, PUSH:푸시, SMS:문자}
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_alarm ──────────────────────────────────────────────────
        private String alarmId;  // 알림ID (YYMMDDhhmmss+rand4)
        private String alarmTitle;  // 알림제목
        private String alarmTypeCd;  // 알림유형 — ALARM_TYPE_CD {ORDER:주문, DELIVERY:배송, CLAIM:클레임, MARKETING:마케팅, SYSTEM:시스템, CONTACT:문의, PUSH:푸시, SMS:문자}
        private String channelCd;  // 발송채널 — ALARM_CHANNEL {EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시, SYSTEM:시스템알림}
        private String targetTypeCd;  // 대상유형 — ALARM_TARGET_TYPE {MEMBER:회원, VENDOR:업체, ADMIN:관리자, ALL:전체}
        private String targetId;  // 대상ID (회원ID 또는 등급코드)
        private String templateId;  // 템플릿ID
        private String alarmMsg;  // 발송내용
        private LocalDateTime alarmSendDate;  // 발송예정일시
        private String alarmStatusCd;  // 발송상태 — ALARM_STATUS {PENDING:대기, SENT:발송완료, FAILED:실패, CANCELLED:취소}
        private Integer alarmSendCount;  // 발송성공수
        private Integer alarmFailCount;  // 발송실패수
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────────
        private String alarmTypeCdNm;  // 알림유형 코드 라벨
        private String channelCdNm;  // 발송채널 코드 라벨
        private String targetTypeCdNm;  // 대상유형 코드 라벨
    }

    /** 응답 */
}
