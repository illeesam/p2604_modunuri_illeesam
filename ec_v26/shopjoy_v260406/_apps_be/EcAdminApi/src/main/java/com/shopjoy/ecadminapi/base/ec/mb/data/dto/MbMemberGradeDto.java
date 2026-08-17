package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MbMemberGradeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 1) private String useYn;                // 사용여부 필터 Y/N
        @Size(max = 21) private String memberGradeId;       // 등급ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberGradeId;               // 등급ID (YYMMDDhhmmss+rand4)
        private String gradeCd;                       // 등급코드 — MEMBER_GRADE
        private String gradeNm;                        // 등급명
        private Integer gradeRank;                     // 등급우선순위 (낮을수록 낮은 등급)
        private Long minPurchaseAmt;                    // 등급 유지 최소 누적구매금액
        private BigDecimal saveRate;                    // 적립률 (%)
        private String useYn;                            // 사용여부 Y/N
        private String regBy;                             // 등록자
        private LocalDateTime regDate;                    // 등록일시
        private String regSiteId;                         // 등록 사이트ID
        private String updBy;                              // 수정자
        private LocalDateTime updDate;                     // 수정일시
    }

}
