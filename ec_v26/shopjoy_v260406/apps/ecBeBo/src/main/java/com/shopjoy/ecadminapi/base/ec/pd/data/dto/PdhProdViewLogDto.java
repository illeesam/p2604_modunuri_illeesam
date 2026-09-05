package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdhProdViewLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String logId;  // 로그ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID (비회원 NULL)
        private String sessionKey;  // 비회원 세션키
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String refId;  // 참조ID (prod_id 등)
        private String refNm;  // 참조명 스냅샷
        private String searchKw;  // 검색어 (SEARCH 유형)
        private String ip;  // IP주소
        private String device;  // User-Agent
        private String referrer;  // 유입경로 URL
        private LocalDateTime viewDate;  // 조회일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
