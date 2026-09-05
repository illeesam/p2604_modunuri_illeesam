package com.shopjoy.ecBeBo.base.ec.dp.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
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
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String areaId;  // 영역ID 필터
        @Size(max = 21) private String uiId;  // UIID 필터 (dp_ui.ui_id)
        private List<String> uiIds;                   // 상위 FK 다건 IN
        @Size(max = 30) private String areaTypeCd;  // 영역유형 필터 — AREA_TYPE_CD {FULL:전체폭, SIDEBAR:사이드바, POPUP:팝업, INLINE:인라인}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String areaId;  // 영역ID (YYMMDDhhmmss+rand4)
        private String uiId;  // UIID (dp_ui.ui_id)
        private String areaCd;  // 영역코드 (예: MAIN_TOP, SIDEBAR_MID)
        private String areaNm;  // 영역명
        private String areaTypeCd;  // 영역유형 — AREA_TYPE_CD {FULL:전체폭, SIDEBAR:사이드바, POPUP:팝업, INLINE:인라인}
        private String areaDesc;  // 영역설명
        private String pathId;  // 점(.) 구분 표시경로
        private String useYn;  // 사용여부 Y/N
        private LocalDate useStartDate;  // 사용시작일
        private LocalDate useEndDate;  // 사용종료일
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<DpPanelDto.Item> panels;       // 소속 패널 목록 (dp_panel.area_id)
    }

}
