package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhSendMsgLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String logId;
        @Size(max = 21) private String userId;
        @Size(max = 21) private String templateId;
        @Size(max = 20) private String typeCd;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_send_msg_log ──────────────────────────────────────────
        private String logId;
        private String siteId;
        private String channelCd;
        private String templateId;
        private String templateCode;
        private String memberId;
        private String userId;
        private String recvPhone;
        private String deviceToken;
        private String senderPhone;
        private String title;
        private String content;
        private String params;
        private String kakaoTplCode;
        private String resultCd;
        private String resultMsg;
        private String failReason;
        private LocalDateTime sendDate;
        private String refTypeCd;
        private String refId;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;
        private String templateNm;
        private String userNm;
        private String resultCdNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
