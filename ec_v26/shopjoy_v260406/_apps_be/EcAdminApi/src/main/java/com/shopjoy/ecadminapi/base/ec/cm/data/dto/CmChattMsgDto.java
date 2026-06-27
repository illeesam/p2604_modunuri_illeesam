package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmChattMsgDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattMsgId;
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String chattId;
        @Size(max = 21) private String senderId;
        @Size(max = 20) private String senderTypeCd;
        @Size(max = 20) private String msgTypeCd;
        @Size(max = 21) private String afterMsgId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattMsgId;
        private String siteId;
        private String chattId;
        private String senderTypeCd;
        private String senderId;
        private String senderNm;
        private String msgText;
        private String msgTypeCd;
        private String attachGrpId;
        private String refType;
        private String refId;
        private String readYn;
        private LocalDateTime sendDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private List<AttachItem> attachFiles;
    }

    @Getter @Setter @NoArgsConstructor
    public static class AttachItem {
        private String attachId;
        private String attachUrl;
        private String attachNm;
        private String attachExt;
        private Long   attachSize;
        private String thumbUrl;
    }

    @Getter @Setter @NoArgsConstructor
    public static class SendRequest {
        private String msgText;
        private String msgTypeCd;
        private String attachGrpId;
        private String refType;
        private String refId;
        private String senderTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
