package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DpPanelDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String pathId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String panelId;
        @Size(max = 30) private String panelTypeCd;
        @Size(max = 30) private String dispPanelStatusCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String panelId;
        private String siteId;
        private String panelNm;
        private String panelTypeCd;
        private String pathId;
        private String visibilityTargets;
        private String useYn;
        private LocalDate useStartDate;
        private LocalDate useEndDate;
        private String dispPanelStatusCd;
        private String dispPanelStatusCdBefore;
        private String contentJson;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<DpPanelItemDto.Item> panelItems;   // 패널 아이템 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
