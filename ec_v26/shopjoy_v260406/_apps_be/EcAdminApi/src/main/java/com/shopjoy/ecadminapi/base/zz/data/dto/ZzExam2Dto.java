package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExam2Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exam1Ids;                 // PK 다건 IN
        @Size(max = 20)  private String exam1Id;       // PK 정확일치
        @Size(max = 20)  private String exam2Id;       // PK 정확일치
        @Size(max = 20)  private String exam1IdLike;   // PK 부분검색
        @Size(max = 20)  private String exam2IdLike;   // PK 부분검색
        @Size(max = 200) private String col21;
        @Size(max = 200) private String col22;
        @Size(max = 200) private String col23;
        @Size(max = 200) private String col24;
        @Size(max = 200) private String col25;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exam1Id;
        private String exam2Id;
        private String col21;
        private String col22;
        private String col23;
        private String col24;
        private String col25;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 계층 연관정보 (getById 시 채움) ──
        private ZzExam1Dto.Item       exam1;    // 상위 exam1 단건
        private List<ZzExam3Dto.Item> exam3s;   // 하위 exam3 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
