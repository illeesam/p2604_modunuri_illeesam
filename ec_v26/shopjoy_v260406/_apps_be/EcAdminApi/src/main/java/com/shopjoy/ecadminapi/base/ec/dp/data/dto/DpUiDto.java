package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DpUiDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String uiId;  // UIID 필터
        @Size(max = 30) private String deviceTypeCd;  // 디바이스유형 필터 — DEVICE_TYPE_CD {PC:PC, MOBILE:모바일, TABLET:태블릿, ALL:공통}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String uiId;  // UIID (YYMMDDhhmmss+rand4)
        private String uiCd;  // UI코드 (예: MOBILE_MAIN, PC_MAIN)
        private String uiNm;  // UI명
        private String uiDesc;  // UI설명
        private String deviceTypeCd;  // 디바이스유형 — DEVICE_TYPE_CD {PC:PC, MOBILE:모바일, TABLET:태블릿, ALL:공통}
        private String pathId;  // 페이지경로
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private LocalDate useStartDate;  // 사용시작일
        private LocalDate useEndDate;  // 사용종료일
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<DpAreaDto.Item> areas;     // 영역 목록
    }

}
