package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExam1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exam1Ids;                 // PK 다건 IN
        @Size(max = 20)  private String exam1Id;       // PK 정확일치
        @Size(max = 20)  private String exam1IdLike;   // PK 부분검색
        @Size(max = 200) private String col11;
        @Size(max = 200) private String col12;
        @Size(max = 200) private String col13;
        @Size(max = 200) private String col14;
        @Size(max = 200) private String col15;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exam1Id;
        private String col11;
        private String col12;
        private String col13;
        private String col14;
        private String col15;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 하위 계층 연관정보 (getById 시 채움) ──
        private List<ZzExam2Dto.Item> exam2s;   // 하위 exam2 목록
        private List<ZzExam3Dto.Item> exam3s;   // 하위 exam3 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
