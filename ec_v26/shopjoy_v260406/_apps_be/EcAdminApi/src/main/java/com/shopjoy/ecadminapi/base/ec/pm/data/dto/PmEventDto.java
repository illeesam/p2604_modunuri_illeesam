package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PmEventDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String eventId;
        private List<String> eventIds;             // PK 다건 IN
        @Size(max = 20) private String eventStatusCd;
        @Size(max = 21)  private String prodId;     // 상품 기준 필터 (EXISTS eq via pm_event_prod)
        @Size(max = 200) private String prodNm;     // 상품명 기준 필터 (EXISTS LIKE via pm_event_prod→pd_prod)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (EXISTS eq via pm_event_prod→pd_prod)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (EXISTS LIKE via pm_event_prod→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (EXISTS eq via pm_event_prod→pd_prod)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (EXISTS LIKE via pm_event_prod→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String eventId;
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
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<PmEventItemDto.Item>    eventItems;   // 이벤트 대상상품 목록
        private List<PmEventBenefitDto.Item> benefits;     // 이벤트 혜택 목록
    }

}
