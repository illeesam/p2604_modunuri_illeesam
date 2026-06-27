package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmChattMemberDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattMemberId;
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String chattId;
        @Size(max = 20) private String memberTypeCd;
        @Size(max = 21) private String refId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattMemberId;
        private String siteId;
        private String chattId;
        private String memberTypeCd;
        private String refId;
        private String refNm;
        private Integer unreadCnt;
        private LocalDateTime joinDate;
        private LocalDateTime leaveDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
