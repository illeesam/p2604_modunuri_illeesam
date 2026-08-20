package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExmy3Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exmy1Ids;                 // PK 다건 IN
        @Size(max = 21)  private String exmy1Id;       // PK 정확일치
        @Size(max = 21)  private String exmy2Id;       // PK 정확일치
        @Size(max = 21)  private String exmy3Id;       // PK 정확일치
        @Size(max = 21)  private String exmy1IdLike;   // PK 부분검색
        @Size(max = 21)  private String exmy2IdLike;   // PK 부분검색
        @Size(max = 21)  private String exmy3IdLike;   // PK 부분검색
        @Size(max = 200) private String col31;  // 예제 범용 컬럼31 검색값
        @Size(max = 200) private String col32;  // 예제 범용 컬럼32 검색값
        @Size(max = 200) private String col33;  // 예제 범용 컬럼33 검색값
        @Size(max = 200) private String col34;  // 예제 범용 컬럼34 검색값
        @Size(max = 200) private String col35;  // 예제 범용 컬럼35 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exmy1Id;  // 상위 exmy1 ID (복합 PK)
        private String exmy2Id;  // 상위 exmy2 ID (복합 PK)
        private String exmy3Id;  // 예제(exmy3, MyBatis) ID (복합 PK)
        private String col31;  // 예제 범용 컬럼31
        private String col32;  // 예제 범용 컬럼32
        private String col33;  // 예제 범용 컬럼33
        private String col34;  // 예제 범용 컬럼34
        private String col35;  // 예제 범용 컬럼35
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── 상위 계층 연관정보 ──
        private ZzExmy1Dto.Item exmy1;   // 상위 exmy1 단건 (exmy1_id)
        private ZzExmy2Dto.Item exmy2;   // 상위 exmy2 단건 (exmy1_id, exmy2_id)
    }

}
