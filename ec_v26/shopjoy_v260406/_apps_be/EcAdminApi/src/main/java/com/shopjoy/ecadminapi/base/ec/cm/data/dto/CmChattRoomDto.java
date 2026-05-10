package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmChattRoomDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String chattRoomId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattRoomId;
        private String siteId;
        private String memberId;
        private String memberNm;
        private String adminUserId;
        private String subject;
        private String chattStatusCd;
        private String chattStatusCdBefore;
        private LocalDateTime lastMsgDate;
        private Integer memberUnreadCnt;
        private Integer adminUnreadCnt;
        private String chattMemo;
        private LocalDateTime closeDate;
        private String closeReason;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
