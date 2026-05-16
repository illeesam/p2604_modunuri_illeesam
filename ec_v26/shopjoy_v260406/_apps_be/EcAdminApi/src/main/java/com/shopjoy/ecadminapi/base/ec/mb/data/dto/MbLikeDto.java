package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbLikeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String likeId;
        @Size(max = 21) private String memberId;
        @Size(max = 50) private String targetTypeCd;
        @Size(max = 21) private String targetId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String likeId;
        private String siteId;
        private String memberId;
        private String targetTypeCd;
        private String targetId;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 연관정보 (목록 시 채움, targetTypeCd=PROD 인 경우) ──
        private PdProdDto.Item prod;   // 찜 대상 상품 단건
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
