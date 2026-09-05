package com.shopjoy.ecBeBo.base.ec.mb.data.dto;

import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbLikeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 21) private String likeId;              // 좋아요ID 필터
        @Size(max = 21) private String memberId;            // 회원ID 필터
        @Size(max = 50) private String targetTypeCd;        // 대상유형 필터 — LIKE_TARGET_TYPE (PRODUCT/BLOG/EVENT)
        @Size(max = 21) private String targetId;            // 대상ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String likeId;                 // 좋아요ID (YYMMDDhhmmss+rand4)
        private String memberId;               // 회원ID (mb_member.member_id)
        private String targetTypeCd;            // 대상유형 — LIKE_TARGET_TYPE (PRODUCT/BLOG/EVENT)
        private String targetTypeCdNm;  // 코드 라벨
        private String targetId;                // 대상ID
        private String regBy;                   // 등록자
        private LocalDateTime regDate;          // 등록일시
        private String regSiteId;               // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                   // 수정자
        private LocalDateTime updDate;          // 수정일시
        // ── 연관정보 (목록 시 채움, targetTypeCd=PROD 인 경우) ──
        private PdProdDto.Item prod;   // 찜 대상 상품 단건
    }


    /** 찜 토글 응답 — { "liked": true/false } */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ToggleRes {
        private boolean liked;   // 토글 후 찜 상태 (true=찜됨, false=취소됨)
    }
}
