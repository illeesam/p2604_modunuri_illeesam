package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExam3Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exam1Ids;                 // PK 다건 IN
        @Size(max = 20)  private String exam1Id;       // PK 정확일치
        @Size(max = 20)  private String exam2Id;       // PK 정확일치
        @Size(max = 20)  private String exam3Id;       // PK 정확일치
        @Size(max = 20)  private String exam1IdLike;   // PK 부분검색
        @Size(max = 20)  private String exam2IdLike;   // PK 부분검색
        @Size(max = 20)  private String exam3IdLike;   // PK 부분검색
        @Size(max = 200) private String col31;
        @Size(max = 200) private String col32;
        @Size(max = 200) private String col33;
        @Size(max = 200) private String col34;
        @Size(max = 200) private String col35;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exam1Id;
        private String exam2Id;
        private String exam3Id;
        private String col31;
        private String col32;
        private String col33;
        private String col34;
        private String col35;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 상위 계층 연관정보 (getById 시 채움) ──
        private ZzExam1Dto.Item exam1;   // 상위 exam1 단건
        private ZzExam2Dto.Item exam2;   // 상위 exam2 단건
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
