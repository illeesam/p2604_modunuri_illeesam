package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAlarmDto {

    /** 조회 요청 */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String alarmId;
        @Size(max = 21) private String pathId;
        @Size(max = 20) private String status;
        @Size(max = 20) private String typeCd;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_alarm ──────────────────────────────────────────────────
        private String alarmId;
        private String siteId;
        private String alarmTitle;
        private String alarmTypeCd;
        private String channelCd;
        private String targetTypeCd;
        private String targetId;
        private String templateId;
        private String alarmMsg;
        private LocalDateTime alarmSendDate;
        private String alarmStatusCd;
        private Integer alarmSendCount;
        private Integer alarmFailCount;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String pathId;

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;
        private String alarmTypeCdNm;
        private String channelCdNm;
        private String targetTypeCdNm;
    }

    /** 응답 */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
