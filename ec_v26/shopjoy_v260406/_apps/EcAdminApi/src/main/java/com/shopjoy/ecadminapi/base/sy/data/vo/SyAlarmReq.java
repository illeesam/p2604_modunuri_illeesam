package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAlarmReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String alarmId;

    @NotBlank(message = "사이트ID는 필수입니다.")
    private String siteId;

    @Size(max = 50, message = "알람 제목은 50자 이내로 입력해주세요.")
    private String alarmTitle;

    private String alarmTypeCd;
    private String channelCd;
    private String targetTypeCd;
    private String targetId;
    private String templateId;

    @Size(max = 15, message = "알람 메시지는 15자 이내로 입력해주세요.")
    private String alarmMsg;
    private LocalDateTime alarmSendDate;
    private String alarmStatusCd;
    private Integer alarmSendCount;
    private Integer alarmFailCount;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SyAlarm toEntity() {
        return SyAlarm.builder()
                .alarmId(alarmId)
                .siteId(siteId)
                .alarmTitle(alarmTitle)
                .alarmTypeCd(alarmTypeCd)
                .channelCd(channelCd)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .templateId(templateId)
                .alarmMsg(alarmMsg)
                .alarmSendDate(alarmSendDate)
                .alarmStatusCd(alarmStatusCd)
                .alarmSendCount(alarmSendCount)
                .alarmFailCount(alarmFailCount)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}
