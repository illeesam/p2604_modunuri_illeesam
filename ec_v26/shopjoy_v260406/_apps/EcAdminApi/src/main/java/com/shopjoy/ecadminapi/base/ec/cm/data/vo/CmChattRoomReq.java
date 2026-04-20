package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmChattRoomReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public CmChattRoom toEntity() {
        return CmChattRoom.builder()
                .chattRoomId(chattRoomId)
                .siteId(siteId)
                .memberId(memberId)
                .memberNm(memberNm)
                .adminUserId(adminUserId)
                .subject(subject)
                .chattStatusCd(chattStatusCd)
                .chattStatusCdBefore(chattStatusCdBefore)
                .lastMsgDate(lastMsgDate)
                .memberUnreadCnt(memberUnreadCnt)
                .adminUnreadCnt(adminUnreadCnt)
                .chattMemo(chattMemo)
                .closeDate(closeDate)
                .closeReason(closeReason)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
