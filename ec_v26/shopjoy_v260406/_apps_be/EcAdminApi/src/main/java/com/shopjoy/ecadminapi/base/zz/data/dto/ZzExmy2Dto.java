package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExmy2Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exmy1Ids;                 // PK 다건 IN
        @Size(max = 21)  private String exmy1Id;       // PK 정확일치
        @Size(max = 21)  private String exmy2Id;       // PK 정확일치
        @Size(max = 21)  private String exmy1IdLike;   // PK 부분검색
        @Size(max = 21)  private String exmy2IdLike;   // PK 부분검색
        @Size(max = 200) private String col21;
        @Size(max = 200) private String col22;
        @Size(max = 200) private String col23;
        @Size(max = 200) private String col24;
        @Size(max = 200) private String col25;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exmy1Id;
        private String exmy2Id;
        private String col21;
        private String col22;
        private String col23;
        private String col24;
        private String col25;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── 상위 계층 연관정보 ──
        private ZzExmy1Dto.Item exmy1;   // 상위 exmy1 단건 (exmy1_id)

        // ── 하위 계층 연관정보 ──
        private List<ZzExmy3Dto.Item> exmy3s;   // 하위 exmy3 목록 (exmy1_id, exmy2_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
