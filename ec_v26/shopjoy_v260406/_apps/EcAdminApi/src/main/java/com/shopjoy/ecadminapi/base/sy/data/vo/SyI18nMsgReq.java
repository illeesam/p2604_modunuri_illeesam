package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyI18nMsgReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String i18nMsgId;
    private String i18nId;
    private String langCd;
    private String i18nMsg;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyI18nMsg toEntity() {
        return SyI18nMsg.builder()
                .i18nMsgId(i18nMsgId)
                .i18nId(i18nId)
                .langCd(langCd)
                .i18nMsg(i18nMsg)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
