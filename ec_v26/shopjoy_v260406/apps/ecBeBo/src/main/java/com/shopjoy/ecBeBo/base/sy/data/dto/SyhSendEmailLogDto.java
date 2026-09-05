package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhSendEmailLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        @Size(max = 21) private String userId;  // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
        @Size(max = 21) private String templateId;  // 템플릿ID (sy_template.template_id)
        @Size(max = 20) private String typeCd;  // 유형코드
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_send_email_log ──────────────────────────────────────────
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String templateId;  // 템플릿ID (sy_template.template_id)
        private String templateCode;  // 템플릿코드 스냅샷
        private String memberId;  // 대상 회원ID (ec_member.member_id, 비회원 NULL)
        private String userId;  // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
        private String fromAddr;  // 발신 이메일
        private String toAddr;  // 수신 이메일
        private String ccAddr;  // 참조 이메일 (복수 시 콤마 구분)
        private String bccAddr;  // 숨은참조 이메일
        private String subject;  // 발송 제목 (치환 완료본)
        private String content;  // 발송 본문 (치환 완료본 HTML)
        private String params;  // 치환 파라미터 JSON (예: {"order_no":"...","member_nm":"..."})
        private String resultCd;  // 발송결과 (코드: SEND_RESULT)
        private String failReason;  // 실패 사유
        private LocalDateTime sendDate;  // 발송일시
        private String refTypeCd;  // 연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)
        private String refId;  // 연관ID
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
        private String templateNm;  // 템플릿명 (조인)
        private String userNm;  // 사용자명 (조인)
        private String resultCdNm;  // 결과코드명 (조인)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
