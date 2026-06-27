package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmChattDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattId;
        @Size(max = 21) private String siteId;
        @Size(max = 20) private String chattStatusCd;
        @Size(max = 21) private String refId;
        @Size(max = 20) private String memberTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattId;
        private String siteId;
        private String subject;
        private String chattStatusCd;
        private String chattStatusCdBefore;
        private LocalDateTime lastMsgDate;
        private String chattMemo;
        private LocalDateTime closeDate;
        private String closeReason;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private List<CmChattMemberDto.Item> members;
        private CmChattMsgDto.Item lastMsg;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
