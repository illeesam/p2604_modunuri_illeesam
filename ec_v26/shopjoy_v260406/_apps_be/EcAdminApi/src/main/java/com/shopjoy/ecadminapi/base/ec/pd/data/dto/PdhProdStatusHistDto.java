package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdhProdStatusHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String prodStatusHistId;  // 이력ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodStatusHistId;  // 이력ID
        private String prodId;  // 상품ID
        private String beforeStatusCd;  // 이전상태 — PROD_STATUS_CD {ACTIVE:판매중, INACTIVE:중지, SOLDOUT:품절, DRAFT:임시저장}
        private String afterStatusCd;  // 변경상태 — PROD_STATUS_CD {ACTIVE:판매중, INACTIVE:중지, SOLDOUT:품절, DRAFT:임시저장}
        private String memo;  // 처리메모
        private String procUserId;  // 처리자 (sy_user.user_id)
        private LocalDateTime procDate;  // 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
