package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmhPushLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String logId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;
        private String siteId;
        private String channelCd;
        private String templateId;
        private String memberId;
        private String recvAddr;
        private String pushLogTitle;
        private String pushLogContent;
        private String resultCd;
        private String failReason;
        private LocalDateTime sendDate;
        private String refTypeCd;
        private String refId;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
