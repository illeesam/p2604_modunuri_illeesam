package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmPlanDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 1) private String useYn;    // 사용여부 필터 Y/N
        @Size(max = 21) private String planId;  // 기획전ID 필터
        @Size(max = 20) private String planStatusCd;  // 상태 필터 — PLAN_STATUS_CD {DRAFT:임시저장, ACTIVE:진행중, ENDED:종료, INACTIVE:비활성}
        @Size(max = 21)  private String prodId;    // 대상상품 ID 필터 (EXISTS eq via pm_plan_item)
        @Size(max = 200) private String prodNm;    // 대상상품명 필터 (EXISTS LIKE via pm_plan_item→pd_prod)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (EXISTS eq via pm_plan_item→pd_prod)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (EXISTS LIKE via pm_plan_item→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (EXISTS eq via pm_plan_item→pd_prod)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (EXISTS LIKE via pm_plan_item→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String planId;               // 기획전ID (YYMMDDhhmmss+rand4)
        private String planNm;               // 기획전명 (내부용)
        private String planTitle;            // 기획전 타이틀 (노출용)
        private String planTypeCd;           // 유형 — PLAN_TYPE_CD {GENERAL:일반기획전, BRAND:브랜드기획전, SEASON:시즌기획전, SALE:세일기획전, AGE:연령대, BEST:베스트, CONCEPT:컨셉, HOME:홈기획전 외 4개}
        private String planTypeCdNm;  // 코드 라벨
        private String planDesc;             // 기획전 설명
        private String thumbnailUrl;         // 썸네일 이미지 URL
        private String bannerUrl;            // 배너 이미지 URL
        private LocalDate startDate;         // 시작일시
        private LocalDate endDate;           // 종료일시
        private String planStatusCd;         // 상태 — PLAN_STATUS_CD {DRAFT:임시저장, ACTIVE:진행중, ENDED:종료, INACTIVE:비활성}
        private String planStatusCdNm;  // 코드 라벨
        private String planStatusCdBefore;   // 변경 전 상태
        private Integer sortOrd;             // 정렬순서
        private String useYn;                // 사용여부 Y/N
        private String regBy;                // 등록자
        private LocalDateTime regDate;       // 등록일
        private String regSiteId;            // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                // 수정자
        private LocalDateTime updDate;       // 수정일
    }

}
