package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdImgDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID 필터
        @Size(max = 21) private String prodImgId;    // 상품이미지ID 필터
        @Size(max = 21) private String prodId;       // 상품ID 필터
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodImgId;           // 상품이미지ID
        private String prodId;              // 상품ID (pd_prod.prod_id)
        private String prodOpt1Id;          // 옵션1 값ID (pd_prod_opt.prod_opt_id, 색상 등, NULL이면 공통 이미지)
        private String prodOpt2Id;          // 옵션2 값ID (pd_prod_opt.prod_opt_id, 사이즈 등, NULL이면 색상 공통)
        private String attachId;            // 첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)
        private String cdnHost;             // CDN 호스트명 (예: cdn.example.com, 원본 시점의 CDN)
        private String cdnImgUrl;           // CDN 원본 이미지 URL (상세 페이지용, sy_attach 기준)
        private String cdnThumbUrl;         // CDN 썸네일 URL (목록/검색/카테고리용, sy_attach 기준)
        private String imgAltText;          // 이미지 대체텍스트 (alt 속성, SEO/접근성)
        private Integer sortOrd;            // 정렬순서
        private String isThumb;             // 대표이미지여부 Y/N
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
    }

}
