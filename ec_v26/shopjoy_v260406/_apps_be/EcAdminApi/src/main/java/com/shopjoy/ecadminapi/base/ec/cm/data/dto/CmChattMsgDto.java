package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
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
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
        /* 첨부는 공통 축약 DTO 를 쓴다 — sy_attach 컬럼명 그대로라 도메인마다 키가 갈리지 않는다.
           attachGrpId 기준으로 CmChattMsgService 가 일괄 주입한다(N+1 회피). */
        private List<SyAttachDto.Brief> attachFiles;
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

}
