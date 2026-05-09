package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmEventDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String eventId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String eventId;
        private String siteId;
        private String eventNm;
        private String eventTypeCd;
        private String imgUrl;
        private String eventTitle;
        private String eventContent;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDate noticeStart;
        private LocalDate noticeEnd;
        private String eventStatusCd;
        private String eventStatusCdBefore;
        private String targetTypeCd;
        private Integer sortOrd;
        private Integer viewCnt;
        private String useYn;
        private String eventDesc;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
