package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

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
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String areaId;  // 영역ID 필터
        private List<String> areaIds;                 // 상위 FK 다건 IN
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String panelId;  // 패널ID 필터
        @Size(max = 30) private String panelTypeCd;  // 표시유형 필터 — PANEL_TYPE_CD {MAIN_BANNER:메인배너, SUB_BANNER:서브배너, POPUP:팝업, SPECIAL:기획전}
        @Size(max = 30) private String dispPanelStatusCd;  // 전시상태 필터 — DISP_PANEL_STATUS_CD {SHOW:노출, HIDE:숨김}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String panelId;  // 패널ID (YYMMDDhhmmss+rand4)
        private String areaId;  // 영역ID (dp_area.area_id)
        private String panelNm;  // 패널명
        private String panelTypeCd;  // 표시유형 — PANEL_TYPE_CD {MAIN_BANNER:메인배너, SUB_BANNER:서브배너, POPUP:팝업, SPECIAL:기획전}
        private String pathId;  // 점(.) 구분 표시경로
        private String visibilityTargets;  // 공개대상 (^CODE^CODE^ 형식)
        private String useYn;  // 사용여부 Y/N
        private LocalDate useStartDate;  // 사용시작일
        private LocalDate useEndDate;  // 사용종료일
        private String dispPanelStatusCd;  // 상태 — DISP_PANEL_STATUS_CD {SHOW:노출, HIDE:숨김}
        private String dispPanelStatusCdBefore;  // 변경 전 패널상태 — DISP_PANEL_STATUS_CD {SHOW:노출, HIDE:숨김}
        private String contentJson;  // 패널콘텐츠 (JSON - 위젯 목록 및 설정)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<DpPanelItemDto.Item> panelItems;   // 패널 아이템 목록
    }

}
