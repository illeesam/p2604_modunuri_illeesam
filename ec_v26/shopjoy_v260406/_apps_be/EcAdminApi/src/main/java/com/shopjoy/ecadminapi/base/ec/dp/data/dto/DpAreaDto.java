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

public class DpAreaDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String pathId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String areaId;
        @Size(max = 21) private String uiId;
        private List<String> uiIds;                   // 상위 FK 다건 IN
        @Size(max = 30) private String areaTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String areaId;
        private String uiId;
        private String siteId;
        private String areaCd;
        private String areaNm;
        private String areaTypeCd;
        private String areaDesc;
        private String pathId;
        private String useYn;
        private LocalDate useStartDate;
        private LocalDate useEndDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<DpAreaPanelDto.Item> panels;   // 영역-패널 연결 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
