package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdhProdContentChgHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String histId;  // 이력ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String histId;  // 이력ID (YYMMDDhhmmss+rand4)
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String prodContentId;  // 상품컨텐츠ID (pd_prod_content.prod_content_id)
        private String contentTypeCd;  // 컨텐츠유형코드 — PROD_CONTENT_TYPE {DETAIL:상세설명, NOTICE:상품공지, GUIDE:이용안내, SIZE_GUIDE:사이즈안내, FILE:파일, HTML:HTML}
        private String contentBefore;  // 변경전 HTML 컨텐츠
        private String contentAfter;  // 변경후 HTML 컨텐츠
        private String chgReason;  // 변경사유 (예: 내용 오류 수정, 계절 업데이트)
        private String chgUserId;  // 처리자 (sy_user.user_id)
        private LocalDateTime chgDate;  // 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
