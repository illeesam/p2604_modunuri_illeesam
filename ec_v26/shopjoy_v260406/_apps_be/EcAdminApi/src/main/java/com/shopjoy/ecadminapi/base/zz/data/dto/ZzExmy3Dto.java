package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class ZzExmy3Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21)  private String exmy1Id;       // PK 정확일치
        @Size(max = 21)  private String exmy2Id;       // PK 정확일치
        @Size(max = 21)  private String exmy3Id;       // PK 정확일치
        @Size(max = 21)  private String exmy1IdLike;   // PK 부분검색
        @Size(max = 21)  private String exmy2IdLike;   // PK 부분검색
        @Size(max = 21)  private String exmy3IdLike;   // PK 부분검색
        @Size(max = 200) private String col31;
        @Size(max = 200) private String col32;
        @Size(max = 200) private String col33;
        @Size(max = 200) private String col34;
        @Size(max = 200) private String col35;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exmy1Id;
        private String exmy2Id;
        private String exmy3Id;
        private String col31;
        private String col32;
        private String col33;
        private String col34;
        private String col35;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── 상위 계층 연관정보 ──
        private ZzExmy1Dto.Item exmy1;   // 상위 exmy1 단건 (exmy1_id)
        private ZzExmy2Dto.Item exmy2;   // 상위 exmy2 단건 (exmy1_id, exmy2_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
