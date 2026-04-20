package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmChattMsgReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String msgId;
    private String siteId;
    private String chattId;
    private String senderCd;
    private String msgText;
    private String refType;
    private String refId;
    private LocalDateTime sendDate;
    private String readYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmChattMsg toEntity() {
        return CmChattMsg.builder()
                .msgId(msgId)
                .siteId(siteId)
                .chattId(chattId)
                .senderCd(senderCd)
                .msgText(msgText)
                .refType(refType)
                .refId(refId)
                .sendDate(sendDate)
                .readYn(readYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
