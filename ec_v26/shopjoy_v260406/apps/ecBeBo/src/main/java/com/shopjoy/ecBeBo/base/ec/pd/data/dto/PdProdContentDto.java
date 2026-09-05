package com.shopjoy.ecBeBo.base.ec.pd.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdContentDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;          // 사이트ID 필터
        @Size(max = 1) private String useYn;              // 사용여부 필터 Y/N
        @Size(max = 21) private String prodContentId;    // 상품컨텐츠ID 필터
        @Size(max = 21) private String prodId;            // 상품ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodContentId;    // 상품컨텐츠ID
        private String prodId;           // 상품ID (pd_prod.prod_id)
        private String contentTypeCd;    // 컨텐츠유형 — PROD_CONTENT_TYPE {DETAIL:상세설명, NOTICE:상품공지, GUIDE:이용안내, SIZE_GUIDE:사이즈안내, FILE:파일, HTML:HTML}
        private String contentHtml;      // HTML 에디터 컨텐츠 (file/url 타입은 CDN URL 문자열)
        private Integer sortOrd;         // 정렬순서
        private String useYn;            // 사용여부 Y/N
        private String regBy;            // 등록자
        private LocalDateTime regDate;   // 등록일
        private String regSiteId;        // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;            // 수정자
        private LocalDateTime updDate;   // 수정일
    }

}
