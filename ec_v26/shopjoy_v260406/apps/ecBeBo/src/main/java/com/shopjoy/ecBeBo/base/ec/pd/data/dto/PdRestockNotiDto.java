package com.shopjoy.ecBeBo.base.ec.pd.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdRestockNotiDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String restockNotiId;  // 재입고알림ID (단건 조회 필터)
        @Size(max = 21) private String prodId;  // 상품ID 필터
        @Size(max = 1)  private String notiYn;  // 알림발송여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String restockNotiId;  // 재입고알림ID (YYMMDDhhmmss+rand4)
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String prodSkuId;  // SKUID (pd_prod_sku.prod_sku_id)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String notiYn;  // 알림발송여부 Y/N
        private LocalDateTime notiDate;  // 알림발송일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
