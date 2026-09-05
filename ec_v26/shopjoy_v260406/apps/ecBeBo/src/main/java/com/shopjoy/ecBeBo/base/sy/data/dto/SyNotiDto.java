package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class SyNotiDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21)  private String siteId;
        @Size(max = 21)  private String notiId;
        @Size(max = 20)  private String recvTypeCd;
        @Size(max = 21)  private String recvId;
        @Size(max = 20)  private String notiTypeCd;
        @Size(max = 20)  private String channelCd;
        @Size(max = 1)   private String readYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_noti ────────────────────────────────────────────
        private String notiId;
        private String recvTypeCd;
        private String recvId;
        private String recvNm;
        private String notiTypeCd;
        private String channelCd;
        private String notiTitle;
        private String notiContent;
        private String linkPage;
        private String refId;
        private String readYn;
        private LocalDateTime readDate;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
    }

    /** 발송 요청 — 수신자 여러 명에게 같은 알림을 한 번에 적재 */
    @Getter @Setter @NoArgsConstructor
    public static class SendReq {
        private List<Recv> recvList;      // 수신자 목록
        @Size(max = 20)  private String notiTypeCd;   // NOTICE/ALARM/SPECIAL
        @Size(max = 20)  private String channelCd;    // mail/sms/kakao/chat/notice
        @Size(max = 300) private String notiTitle;
        private String notiContent;
        @Size(max = 100) private String linkPage;
        @Size(max = 21)  private String refId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Recv {
        @Size(max = 20)  private String recvTypeCd;   // MEMBER / USER
        @Size(max = 21)  private String recvId;
        @Size(max = 100) private String recvNm;
    }

}
