package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExmy1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21)  private String exmy1Id;       // PK 정확일치
        @Size(max = 21)  private String exmy1IdLike;   // PK 부분검색
        @Size(max = 200) private String col11;
        @Size(max = 200) private String col12;
        @Size(max = 200) private String col13;
        @Size(max = 200) private String col14;
        @Size(max = 200) private String col15;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exmy1Id;
        private String col11;
        private String col12;
        private String col13;
        private String col14;
        private String col15;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 하위 계층 연관정보 ──
        private List<ZzExmy2Dto.Item> exmy2s;   // 하위 exmy2 목록 (exmy1_id)
        private List<ZzExmy3Dto.Item> exmy3s;   // 하위 exmy3 목록 (exmy1_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
