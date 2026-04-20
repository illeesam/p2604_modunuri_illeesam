package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyContactReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String contactId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String categoryCd;
    private String contactTitle;
    private String contactContent;
    private String attachGrpId;
    private String contactStatusCd;
    private String contactAnswer;
    private String answerUserId;
    private LocalDateTime answerDate;
    private LocalDateTime contactDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyContact toEntity() {
        return SyContact.builder()
                .contactId(contactId)
                .siteId(siteId)
                .memberId(memberId)
                .memberNm(memberNm)
                .categoryCd(categoryCd)
                .contactTitle(contactTitle)
                .contactContent(contactContent)
                .attachGrpId(attachGrpId)
                .contactStatusCd(contactStatusCd)
                .contactAnswer(contactAnswer)
                .answerUserId(answerUserId)
                .answerDate(answerDate)
                .contactDate(contactDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
